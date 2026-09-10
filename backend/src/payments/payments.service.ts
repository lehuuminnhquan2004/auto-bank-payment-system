import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import { Payment, } from '../generated/prisma/client.js';
import { PaymentStatus, Prisma, } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: bigint, amount: number) {

    const expiresInMinutes = Number(
      this.configService.get<string>(
        'PAYMENT_EXPIRES_IN_MINUTES',
      ) ?? '15',
    );

    const expiredAt = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    );

    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const paymentCode = this.generatePaymentCode();

      try{
        const payment = await this.prisma.payment.create({
          data: {
            userId,
            paymentCode,
            amount: BigInt(amount),
            status: PaymentStatus.PENDING,
            expiredAt,
          },
        });

      return this.toResponse(payment);
      }catch(error){
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

  async findByIdForUser(
    paymentId: bigint,
    userId: bigint,
  ) {
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

    return payments.map((payment) =>
      this.toResponse(payment),
    );
  }

  private generatePaymentCode() {
    return `PAY${randomBytes(6)
      .toString('hex')
      .toUpperCase()}`;
  }

  private toResponse(payment: Payment) {
    return {
      id: payment.id.toString(),
      paymentCode: payment.paymentCode,
      amount: payment.amount.toString(),
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      expiredAt: payment.expiredAt,
      paidAt: payment.paidAt,
      
      qrUrl: this.buildQrUrl(
      payment.amount,
      payment.paymentCode,
      ),
      bank: {
        bankId:
          this.configService.getOrThrow<string>('BANK_ID'),
        accountNo:
          this.configService.getOrThrow<string>('BANK_ACCOUNT_NO'),
        accountName:
          this.configService.getOrThrow<string>('BANK_ACCOUNT_NAME'),
      },
    };
  }
  
//Lazy expiration
  private async expireIfNeeded(
    payment: Payment,
    ): Promise<Payment> {
    if (
      payment.status !== PaymentStatus.PENDING ||
      new Date() <= payment.expiredAt
    ) {
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
  private buildQrUrl(
    amount: bigint,
    paymentCode: string,
  ) {
    const bankId =
      this.configService.getOrThrow<string>('BANK_ID');

    const accountNo =
      this.configService.getOrThrow<string>(
        'BANK_ACCOUNT_NO',
      );

    const accountName =
      this.configService.getOrThrow<string>(
        'BANK_ACCOUNT_NAME',
      );

    const template =
      this.configService.get<string>(
        'VIETQR_TEMPLATE',
      ) ?? 'compact2';

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
