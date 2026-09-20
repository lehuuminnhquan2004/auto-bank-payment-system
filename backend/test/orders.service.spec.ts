import { BadRequestException, ConflictException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import { OrderStatus } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { OrdersService } from '../src/orders/orders.service.js';

const checkoutKey = '550e8400-e29b-41d4-a716-446655440000';

const now = new Date('2026-09-20T00:00:00.000Z');

function createPrismaMock() {
  const orderFindUnique = vi.fn();
  const productFindMany = vi.fn();
  const orderCreate = vi.fn();

  const transactionClient = {
    product: {
      findMany: productFindMany,
    },

    order: {
      create: orderCreate,
    },
  };

  const transaction = vi.fn(
    async (callback: (tx: typeof transactionClient) => Promise<unknown>) => {
      return callback(transactionClient);
    },
  );

  const prisma = {
    order: {
      findUnique: orderFindUnique,
    },

    $transaction: transaction,
  } as unknown as PrismaService;

  return {
    prisma,
    orderFindUnique,
    productFindMany,
    orderCreate,
    transaction,
  };
}

describe('OrdersService', () => {
  it('creates an order using prices from the database', async () => {
    const { prisma, orderFindUnique, productFindMany, orderCreate } =
      createPrismaMock();

    orderFindUnique.mockResolvedValue(null);

    productFindMany.mockResolvedValue([
      {
        id: 1n,
        name: 'Sản phẩm 1',
        price: 59000n,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2n,
        name: 'Sản phẩm 2',
        price: 129000n,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    orderCreate.mockResolvedValue({
      id: 10n,
      userId: 7n,
      checkoutKey,
      requestHash: 'mock-request-hash',
      status: OrderStatus.PENDING,
      totalAmount: 247000n,
      createdAt: now,
      updatedAt: now,
      paidAt: null,
      cancelledAt: null,
      payment: null,

      items: [
        {
          id: 101n,
          orderId: 10n,
          productId: 1n,
          productNameSnapshot: 'Sản phẩm 1',
          unitPriceSnapshot: 59000n,
          quantity: 2,
          subtotal: 118000n,
        },
        {
          id: 102n,
          orderId: 10n,
          productId: 2n,
          productNameSnapshot: 'Sản phẩm 2',
          unitPriceSnapshot: 129000n,
          quantity: 1,
          subtotal: 129000n,
        },
      ],
    });

    const service = new OrdersService(prisma);

    /*
     * Cố ý gửi product 2 trước
     * product 1 để kiểm tra service
     * có chuẩn hóa thứ tự hay không.
     */
    const result = await service.create(7n, {
      checkoutKey,

      items: [
        {
          productId: '2',
          quantity: 1,
        },
        {
          productId: '1',
          quantity: 2,
        },
      ],
    });

    expect(productFindMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [1n, 2n],
        },

        isActive: true,

        price: {
          gt: 0n,
        },
      },
    });

    expect(orderCreate).toHaveBeenCalledWith({
      data: {
        userId: 7n,
        checkoutKey,

        requestHash: expect.stringMatching(/^[0-9a-f]{64}$/),

        status: OrderStatus.PENDING,

        totalAmount: 247000n,

        items: {
          create: [
            {
              productId: 1n,
              productNameSnapshot: 'Sản phẩm 1',
              unitPriceSnapshot: 59000n,
              quantity: 2,
              subtotal: 118000n,
            },
            {
              productId: 2n,
              productNameSnapshot: 'Sản phẩm 2',
              unitPriceSnapshot: 129000n,
              quantity: 1,
              subtotal: 129000n,
            },
          ],
        },
      },

      include: {
        items: {
          orderBy: {
            id: 'asc',
          },
        },

        payment: true,
      },
    });

    expect(result).toMatchObject({
      id: '10',
      status: OrderStatus.PENDING,
      totalAmount: '247000',
      paymentId: null,
      paymentStatus: null,
      paymentMethod: null,
    });

    expect(result.items).toEqual([
      {
        productId: '1',
        name: 'Sản phẩm 1',
        unitPrice: '59000',
        quantity: 2,
        subtotal: '118000',
      },
      {
        productId: '2',
        name: 'Sản phẩm 2',
        unitPrice: '129000',
        quantity: 1,
        subtotal: '129000',
      },
    ]);
  });

  it('returns the existing order for the same checkout request', async () => {
    const { prisma, orderFindUnique, transaction } = createPrismaMock();

    const canonicalItems = [
      {
        productId: '1',
        quantity: 1,
      },
    ];

    const requestHash = createHash('sha256')
      .update(JSON.stringify(canonicalItems))
      .digest('hex');

    orderFindUnique.mockResolvedValue({
      id: 20n,
      userId: 7n,
      checkoutKey,
      requestHash,
      status: OrderStatus.PENDING,
      totalAmount: 59000n,
      createdAt: now,
      updatedAt: now,
      paidAt: null,
      cancelledAt: null,
      payment: null,

      items: [
        {
          id: 201n,
          orderId: 20n,
          productId: 1n,
          productNameSnapshot: 'Sản phẩm 1',
          unitPriceSnapshot: 59000n,
          quantity: 1,
          subtotal: 59000n,
        },
      ],
    });

    const service = new OrdersService(prisma);

    const result = await service.create(7n, {
      checkoutKey,
      items: canonicalItems,
    });

    expect(result.id).toBe('20');

    /*
     * Order đã tồn tại nên không mở
     * transaction tạo Order mới.
     */
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects the same checkout key with a different cart', async () => {
    const { prisma, orderFindUnique, transaction } = createPrismaMock();

    orderFindUnique.mockResolvedValue({
      id: 30n,
      userId: 7n,
      checkoutKey,

      /*
       * Hash không trùng với
       * cart gửi lên.
       */
      requestHash: 'different-request-hash',

      status: OrderStatus.PENDING,
      totalAmount: 59000n,
      createdAt: now,
      updatedAt: now,
      paidAt: null,
      cancelledAt: null,
      payment: null,
      items: [],
    });

    const service = new OrdersService(prisma);

    await expect(
      service.create(7n, {
        checkoutKey,

        items: [
          {
            productId: '1',
            quantity: 2,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects unavailable products', async () => {
    const { prisma, orderFindUnique, productFindMany, orderCreate } =
      createPrismaMock();

    orderFindUnique.mockResolvedValue(null);

    /*
     * Database không trả sản phẩm:
     * không tồn tại, inactive hoặc
     * price không hợp lệ.
     */
    productFindMany.mockResolvedValue([]);

    const service = new OrdersService(prisma);

    await expect(
      service.create(7n, {
        checkoutKey,

        items: [
          {
            productId: '999',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(orderCreate).not.toHaveBeenCalled();
  });
});
