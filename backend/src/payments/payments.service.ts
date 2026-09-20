import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import {
  Payment,
  PaymentStatus,
  Prisma,
  PaymentMethod,
  OrderStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

type LockedOrder = {
  id: bigint;
  user_id: bigint;
  total_amount: bigint;
  status: OrderStatus;
};

type LockedPaymentReference = {
  id: bigint;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: bigint, amount: number) {
    const expiresInMinutes = Number(
      this.configService.get<string>('PAYMENT_EXPIRES_IN_MINUTES') ?? '15',
    );

    const expiredAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const paymentCode = this.generatePaymentCode();

      try {
        const payment = await this.prisma.payment.create({
          data: {
            userId,
            orderId: null,
            paymentCode,
            amount: BigInt(amount),
            status: PaymentStatus.PENDING,
            method: PaymentMethod.BANK_TRANSFER,
            expiredAt,
          },
        });

        return this.toResponse(payment);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }

        throw error;
      }
    }
    throw new InternalServerErrorException(
      'Unable to generate unique payment code',
    );
  }

  //tao ma thanh toan cho don hang
  async createForOrder(userId: bigint, orderId: bigint) {
    const expiresInMinutes = Number(
      this.configService.get<string>('PAYMENT_EXPIRES_IN_MINUTES') ?? '15',
    );

    const expiredAt = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    );

    for (let attempt = 0; attempt < 5; attempt++) {
      const paymentCode = this.generatePaymentCode();

      try {
        const payment = await this.prisma.$transaction(async (tx) => {
          const [order] = await tx.$queryRaw<LockedOrder[]>`
            SELECT id, user_id, total_amount, status
            FROM orders
            WHERE id = ${orderId} AND user_id = ${userId}
            LIMIT 1
            FOR UPDATE
          `;

          if (!order) {
            throw new NotFoundException('Order not found');
          }

          if (order.status !== OrderStatus.PENDING) {
            throw new ConflictException('Order is not pending');
          }

          const [existingPayment] =
            await tx.$queryRaw<LockedPaymentReference[]>`
              SELECT id
              FROM payments
              WHERE order_id = ${order.id}
              LIMIT 1
              FOR UPDATE
            `;

          if (existingPayment) {
            throw new ConflictException(
              'Order already has a payment',
            );
          }

          return tx.payment.create({
            data: {
              userId: order.user_id,
              orderId: order.id,
              paymentCode,
              amount: order.total_amount,
              method: PaymentMethod.BANK_TRANSFER,
              status: PaymentStatus.PENDING,
              expiredAt,
            },
          });
        });

        return this.toResponse(payment);
      } catch (error) {
        if (
          this.isUniqueCollision(error, [
            'payment_code',
            'paymentCode',
          ])
        ) {
          continue;
        }

        if (
          this.isUniqueCollision(error, [
            'order_id',
            'orderId',
          ])
        ) {
          throw new ConflictException(
            'Order already has a payment',
          );
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      'Unable to generate unique payment code',
    );
  }

  async findByIdForUser(paymentId: bigint, userId: bigint) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    const currentPayment = await this.expireIfNeeded(payment);

    return this.toResponse(currentPayment);
  }

  async findAllForUser(userId: bigint) {
    await this.prisma.payment.updateMany({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        expiredAt: {
          lt: new Date(),
        },
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => this.toResponse(payment));
  }


  private generatePaymentCode() {
    return `PAY${randomBytes(6).toString('hex').toUpperCase()}`;
  }


  private isUniqueCollision(
    error: unknown,
    fields: string[],
  ) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return false;
    }

    const target = error.meta?.target;

    const targetText = Array.isArray(target)
      ? target.map(String).join(',')
      : String(target ?? '');

    return fields.some(
      (field) =>
        targetText.includes(field) ||
        error.message.includes(field),
    );
  }

  private toResponse(payment: Payment) {
    const isBankTransfer = payment.method === PaymentMethod.BANK_TRANSFER;

    return {
      id: payment.id.toString(),
      orderId: payment.orderId?.toString() ?? null,
      method: payment.method,
      paymentCode: payment.paymentCode,
      amount: payment.amount.toString(),
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      expiredAt: payment.expiredAt,
      paidAt: payment.paidAt,
      bank: isBankTransfer
        ? {
            bankId: this.configService.getOrThrow<string>('BANK_ID'),
            accountNo: this.configService.getOrThrow<string>('BANK_ACCOUNT_NO'),
            accountName:
              this.configService.getOrThrow<string>('BANK_ACCOUNT_NAME'),
          }
        : null,
      qrUrl: isBankTransfer
        ? this.buildQrUrl(payment.amount, payment.paymentCode)
        : null,
    };
  }

  //Lazy expiration
  private async expireIfNeeded(payment: Payment): Promise<Payment> {
    if (payment.status !== PaymentStatus.PENDING) {
      return payment;
    }

    if (payment.expiredAt === null) {
      throw new InternalServerErrorException(
        'Payment expiredAt is null for pending payment',
      );
    }
    if (payment.expiredAt > new Date()) {
      return payment;
    }

    await this.prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.EXPIRED,
      },
    });

    return this.prisma.payment.findUniqueOrThrow({
      where: {
        id: payment.id,
      },
    });
  }

  //TAO QR URL
  private buildQrUrl(amount: bigint, paymentCode: string) {
    const bankId = this.configService.getOrThrow<string>('BANK_ID');

    const accountNo = this.configService.getOrThrow<string>('BANK_ACCOUNT_NO');

    const accountName =
      this.configService.getOrThrow<string>('BANK_ACCOUNT_NAME');

    const template =
      this.configService.get<string>('VIETQR_TEMPLATE') ?? 'compact2';

    const params = new URLSearchParams({
      amount: amount.toString(),
      addInfo: paymentCode,
      accountName,
    });

    return (
      `https://img.vietqr.io/image/` +
      `${encodeURIComponent(bankId)}-` +
      `${encodeURIComponent(accountNo)}-` +
      `${encodeURIComponent(template)}.png?` +
      params.toString()
    );
  }
}
