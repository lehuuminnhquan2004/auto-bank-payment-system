import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import {
  OrderStatus,
  Prisma,
  PaymentMethod,
  PaymentStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PaymentsService } from '../payments/payments.service.js';

const MAX_SIGNED_BIGINT = 9223372036854775807n;

const orderInclude = {
  items: {
    orderBy: {
      id: 'asc',
    },
  },
  payment: true,
} as const;

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;
type LockedOrder = {
  id: bigint;
  user_id: bigint;
  total_amount: bigint;
  status: OrderStatus;
};
type LockedPaymentReference = {
  id: bigint;
};
type LockedUser = {
  id: bigint;
  balance: bigint;
};
type LockedPaymentForCancel = {
  id: bigint;
  status: PaymentStatus;
};
const MAX_PAYMENT_CODE_ATTEMPTS = 5;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(userId: bigint, dto: CreateOrderDto) {
    const normalizedItems = this.normalizeItems(dto);

    const requestHash = this.createRequestHash(normalizedItems);

    const uniqueWhere = {
      userId_checkoutKey: {
        userId,
        checkoutKey: dto.checkoutKey,
      },
    };

    /*
     * Fast path cho request được gửi lại
     * sau khi Order đã được tạo.
     */
    const existingOrder = await this.prisma.order.findUnique({
      where: uniqueWhere,
      include: orderInclude,
    });

    if (existingOrder) {
      return this.replayExistingOrder(existingOrder, requestHash);
    }

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const productIds = normalizedItems.map((item) => item.productId);

        const products = await tx.product.findMany({
          where: {
            id: {
              in: productIds,
            },

            isActive: true,

            price: {
              gt: 0n,
            },
          },
        });

        if (products.length !== normalizedItems.length) {
          throw new BadRequestException('One or more products are unavailable');
        }

        const productMap = new Map(
          products.map((product) => [product.id.toString(), product]),
        );

        let totalAmount = 0n;

        const snapshotItems = normalizedItems.map((item) => {
          const product = productMap.get(item.productId.toString());

          if (!product) {
            throw new BadRequestException('Product unavailable');
          }

          const subtotal = product.price * BigInt(item.quantity);

          if (subtotal > MAX_SIGNED_BIGINT) {
            throw new BadRequestException('Order item total is too large');
          }

          totalAmount += subtotal;

          if (totalAmount > MAX_SIGNED_BIGINT) {
            throw new BadRequestException('Order total is too large');
          }

          return {
            productId: product.id,

            productNameSnapshot: product.name,

            unitPriceSnapshot: product.price,

            quantity: item.quantity,

            subtotal,
          };
        });

        if (totalAmount <= 0n) {
          throw new BadRequestException('Invalid order total');
        }

        return tx.order.create({
          data: {
            userId,

            checkoutKey: dto.checkoutKey,

            requestHash,

            status: OrderStatus.PENDING,

            totalAmount,

            items: {
              create: snapshotItems,
            },
          },

          include: orderInclude,
        });
      });

      return this.toResponse(order);
    } catch (error) {
      /*
       * Hai request cùng checkoutKey
       * có thể vượt qua kiểm tra ban đầu
       * cùng lúc.
       *
       * Unique constraint quyết định
       * request nào tạo Order thành công.
       */
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const winner = await this.prisma.order.findUnique({
          where: uniqueWhere,
          include: orderInclude,
        });

        if (winner) {
          return this.replayExistingOrder(winner, requestHash);
        }
      }

      throw error;
    }
  }

  // Xu ly thanh toan bang so du cua user
  async payWithBalance(userId: bigint, orderId: bigint) {
    for (let attempt = 0; attempt < MAX_PAYMENT_CODE_ATTEMPTS; attempt++) {
      const paymentCode = this.generatePaymentCode();

      try {
        const order = await this.prisma.$transaction(async (tx) => {
          // Thu tu lock chung: Order -> Payment -> User.
          const [lockedOrder] = await tx.$queryRaw<LockedOrder[]>`
            SELECT id, user_id, total_amount, status
            FROM orders
            WHERE id = ${orderId} AND user_id = ${userId}
            LIMIT 1
            FOR UPDATE
          `;

          if (!lockedOrder) {
            throw new NotFoundException('Order not found');
          }

          if (lockedOrder.status !== OrderStatus.PENDING) {
            throw new ConflictException('Order is not pending');
          }

          const [existingPayment] = await tx.$queryRaw<
            LockedPaymentReference[]
          >`
            SELECT id
            FROM payments
            WHERE order_id = ${lockedOrder.id}
            LIMIT 1
            FOR UPDATE
          `;

          if (existingPayment) {
            throw new ConflictException('Order already has a payment');
          }

          const [lockedUser] = await tx.$queryRaw<LockedUser[]>`
            SELECT id, balance
            FROM users
            WHERE id = ${userId}
            LIMIT 1
            FOR UPDATE
          `;

          if (!lockedUser) {
            throw new NotFoundException('User not found');
          }

          if (lockedUser.balance < lockedOrder.total_amount) {
            throw new BadRequestException('Insufficient balance');
          }

          const now = new Date();

          await tx.payment.create({
            data: {
              userId: lockedOrder.user_id,
              orderId: lockedOrder.id,
              paymentCode,
              amount: lockedOrder.total_amount,
              method: PaymentMethod.BALANCE,
              status: PaymentStatus.PAID,
              expiredAt: null,
              paidAt: now,
            },
          });

          const balanceUpdate = await tx.user.updateMany({
            where: {
              id: lockedUser.id,
              balance: { gte: lockedOrder.total_amount },
            },
            data: {
              balance: { decrement: lockedOrder.total_amount },
            },
          });

          if (balanceUpdate.count !== 1) {
            throw new ConflictException('Balance changed, please retry');
          }

          const orderUpdate = await tx.order.updateMany({
            where: {
              id: lockedOrder.id,
              userId: lockedOrder.user_id,
              status: OrderStatus.PENDING,
            },
            data: {
              status: OrderStatus.PAID,
              paidAt: now,
            },
          });

          if (orderUpdate.count !== 1) {
            throw new ConflictException('Order is no longer payable');
          }

          return tx.order.findUniqueOrThrow({
            where: { id: lockedOrder.id },
            include: orderInclude,
          });
        });

        return this.toResponse(order);
      } catch (error) {
        // Chi retry khi paymentCode bi trung.
        if (this.isPaymentCodeCollision(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      'Unable to generate unique payment code',
    );
  }

  async cancel(userId: bigint, orderId: bigint) {
    const order = await this.prisma.$transaction(async (tx) => {
      /*
       * Thứ tự khóa chung: Order → Payment.
       */
      const [lockedOrder] = await tx.$queryRaw<LockedOrder[]>`
        SELECT id, user_id, total_amount, status
        FROM orders
        WHERE id = ${orderId} AND user_id = ${userId}
        LIMIT 1
        FOR UPDATE
      `;

      if (!lockedOrder) {
        throw new NotFoundException('Order not found');
      }

      if (lockedOrder.status !== OrderStatus.PENDING) {
        throw new ConflictException('Order is not pending');
      }

      const [payment] = await tx.$queryRaw<LockedPaymentForCancel[]>`
          SELECT id, status
          FROM payments
          WHERE order_id = ${lockedOrder.id}
          LIMIT 1
          FOR UPDATE
        `;

      /*
       * Trạng thái này không nên xảy ra nếu webhook
       * đã cập nhật Payment và Order cùng transaction.
       */
      if (payment?.status === PaymentStatus.PAID) {
        throw new ConflictException('Order payment is already paid');
      }

      const now = new Date();

      /*
       * Chỉ Payment PENDING mới cần chuyển CANCELLED.
       */
      if (payment?.status === PaymentStatus.PENDING) {
        const paymentUpdate = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.CANCELLED,
          },
        });

        if (paymentUpdate.count !== 1) {
          throw new ConflictException('Payment is no longer cancellable');
        }
      }

      const orderUpdate = await tx.order.updateMany({
        where: {
          id: lockedOrder.id,
          userId: lockedOrder.user_id,
          status: OrderStatus.PENDING,
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: now,
        },
      });

      if (orderUpdate.count !== 1) {
        throw new ConflictException('Order is no longer cancellable');
      }

      return tx.order.findUniqueOrThrow({
        where: {
          id: lockedOrder.id,
        },
        include: orderInclude,
      });
    });

    return this.toResponse(order);
  }

  private generatePaymentCode() {
    return `PAY${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  private isPaymentCodeCollision(error: unknown) {
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

    return (
      targetText.includes('payment_code') ||
      targetText.includes('paymentCode') ||
      error.message.includes('payment_code') ||
      error.message.includes('paymentCode')
    );
  }

  private normalizeItems(dto: CreateOrderDto) {
    const normalizedItems = dto.items.map((item) => {
      const productId = BigInt(item.productId);

      if (productId <= 0n || productId > MAX_SIGNED_BIGINT) {
        throw new BadRequestException('Invalid product id');
      }

      return {
        productId,
        quantity: item.quantity,
      };
    });

    const uniqueProductIds = new Set(
      normalizedItems.map((item) => item.productId.toString()),
    );

    if (uniqueProductIds.size !== normalizedItems.length) {
      throw new BadRequestException('Duplicate product');
    }

    normalizedItems.sort((first, second) => {
      if (first.productId < second.productId) {
        return -1;
      }

      if (first.productId > second.productId) {
        return 1;
      }

      return 0;
    });

    return normalizedItems;
  }

  private createRequestHash(
    items: Array<{
      productId: bigint;
      quantity: number;
    }>,
  ) {
    const canonicalItems = items.map((item) => ({
      productId: item.productId.toString(),

      quantity: item.quantity,
    }));

    return createHash('sha256')
      .update(JSON.stringify(canonicalItems))
      .digest('hex');
  }

  private replayExistingOrder(order: OrderWithDetails, requestHash: string) {
    if (order.requestHash !== requestHash) {
      throw new ConflictException(
        'Checkout key already used with a different cart',
      );
    }

    return this.toResponse(order);
  }

  private toResponse(order: OrderWithDetails) {
    return {
      id: order.id.toString(),

      status: order.status,

      totalAmount: order.totalAmount.toString(),

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      cancelledAt: order.cancelledAt,

      paymentId: order.payment?.id.toString() ?? null,

      paymentStatus: order.payment?.status ?? null,

      paymentMethod: order.payment?.method ?? null,

      items: order.items.map((item) => ({
        productId: item.productId.toString(),

        name: item.productNameSnapshot,

        unitPrice: item.unitPriceSnapshot.toString(),

        quantity: item.quantity,

        subtotal: item.subtotal.toString(),
      })),
    };
  }

  //LAY SAN PHAM CUA USER ID=?
  async findAllForUser(userId: bigint) {
    await this.paymentsService.expireOrderPaymentsForUser(userId);
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
      },

      include: orderInclude,

      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      take: 100,
    });

    return orders.map((order) => this.toResponse(order));
  }

  //LAY SAN PHAM CUA USER ID=? VA ORDER ID=?
  async findByIdForUser(orderId: bigint, userId: bigint) {
    await this.paymentsService.expireOrderPaymentIfNeeded(userId, orderId);
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },

      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponse(order);
  }
}
