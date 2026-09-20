import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

import {
  OrderStatus,
  Prisma,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

const MAX_SIGNED_BIGINT =
  9223372036854775807n;

const orderInclude = {
  items: true,
  payment: true,
} as const;

type OrderWithDetails =
  Prisma.OrderGetPayload<{
    include: typeof orderInclude;
  }>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: bigint,
    dto: CreateOrderDto,
  ) {
    const normalizedItems =
      this.normalizeItems(dto);

    const requestHash =
      this.createRequestHash(
        normalizedItems,
      );

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
    const existingOrder =
      await this.prisma.order.findUnique({
        where: uniqueWhere,
        include: orderInclude,
      });

    if (existingOrder) {
      return this.replayExistingOrder(
        existingOrder,
        requestHash,
      );
    }

    try {
      const order =
        await this.prisma.$transaction(
          async (tx) => {
            const productIds =
              normalizedItems.map(
                (item) =>
                  item.productId,
              );

            const products =
              await tx.product.findMany({
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

            if (
              products.length !==
              normalizedItems.length
            ) {
              throw new BadRequestException(
                'One or more products are unavailable',
              );
            }

            const productMap =
              new Map(
                products.map(
                  (product) => [
                    product.id.toString(),
                    product,
                  ],
                ),
              );

            let totalAmount = 0n;

            const snapshotItems =
              normalizedItems.map(
                (item) => {
                  const product =
                    productMap.get(
                      item.productId.toString(),
                    );

                  if (!product) {
                    throw new BadRequestException(
                      'Product unavailable',
                    );
                  }

                  const subtotal =
                    product.price *
                    BigInt(
                      item.quantity,
                    );

                  if (
                    subtotal >
                    MAX_SIGNED_BIGINT
                  ) {
                    throw new BadRequestException(
                      'Order item total is too large',
                    );
                  }

                  totalAmount += subtotal;

                  if (
                    totalAmount >
                    MAX_SIGNED_BIGINT
                  ) {
                    throw new BadRequestException(
                      'Order total is too large',
                    );
                  }

                  return {
                    productId:
                      product.id,

                    productNameSnapshot:
                      product.name,

                    unitPriceSnapshot:
                      product.price,

                    quantity:
                      item.quantity,

                    subtotal,
                  };
                },
              );

            if (totalAmount <= 0n) {
              throw new BadRequestException(
                'Invalid order total',
              );
            }

            return tx.order.create({
              data: {
                userId,

                checkoutKey:
                  dto.checkoutKey,

                requestHash,

                status:
                  OrderStatus.PENDING,

                totalAmount,

                items: {
                  create:
                    snapshotItems,
                },
              },

              include: orderInclude,
            });
          },
        );

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
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const winner =
          await this.prisma.order.findUnique({
            where: uniqueWhere,
            include: orderInclude,
          });

        if (winner) {
          return this.replayExistingOrder(
            winner,
            requestHash,
          );
        }
      }

      throw error;
    }
  }

  private normalizeItems(
    dto: CreateOrderDto,
  ) {
    const normalizedItems =
      dto.items.map((item) => {
        const productId =
          BigInt(item.productId);

        if (
          productId <= 0n ||
          productId >
            MAX_SIGNED_BIGINT
        ) {
          throw new BadRequestException(
            'Invalid product id',
          );
        }

        return {
          productId,
          quantity: item.quantity,
        };
      });

    const uniqueProductIds =
      new Set(
        normalizedItems.map(
          (item) =>
            item.productId.toString(),
        ),
      );

    if (
      uniqueProductIds.size !==
      normalizedItems.length
    ) {
      throw new BadRequestException(
        'Duplicate product',
      );
    }

    normalizedItems.sort(
      (first, second) => {
        if (
          first.productId <
          second.productId
        ) {
          return -1;
        }

        if (
          first.productId >
          second.productId
        ) {
          return 1;
        }

        return 0;
      },
    );

    return normalizedItems;
  }

  private createRequestHash(
    items: Array<{
      productId: bigint;
      quantity: number;
    }>,
  ) {
    const canonicalItems =
      items.map((item) => ({
        productId:
          item.productId.toString(),

        quantity: item.quantity,
      }));

    return createHash('sha256')
      .update(
        JSON.stringify(
          canonicalItems,
        ),
      )
      .digest('hex');
  }

  private replayExistingOrder(
    order: OrderWithDetails,
    requestHash: string,
  ) {
    if (
      order.requestHash !==
      requestHash
    ) {
      throw new ConflictException(
        'Checkout key already used with a different cart',
      );
    }

    return this.toResponse(order);
  }

  private toResponse(
    order: OrderWithDetails,
  ) {
    return {
      id: order.id.toString(),

      status: order.status,

      totalAmount:
        order.totalAmount.toString(),

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      cancelledAt:
        order.cancelledAt,

      paymentId:
        order.payment?.id.toString() ??
        null,

      paymentStatus:
        order.payment?.status ?? null,

      paymentMethod:
        order.payment?.method ?? null,

      items: order.items.map(
        (item) => ({
          productId:
            item.productId.toString(),

          name:
            item.productNameSnapshot,

          unitPrice:
            item.unitPriceSnapshot.toString(),

          quantity: item.quantity,

          subtotal:
            item.subtotal.toString(),
        }),
      ),
    };
  }
}