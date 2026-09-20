import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { PaymentStatus, Prisma } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PaymentsService } from '../src/payments/payments.service.js';

describe('PaymentsService', () => {
  const configServiceMock = {
    get: vi.fn((key: string) => {
      if (key === 'PAYMENT_EXPIRES_IN_MINUTES') {
        return '15';
      }

      return undefined;
    }),
  } as unknown as ConfigService;

  const createPaymentResult = {
    id: 1n,
    userId: 1n,
    paymentCode: 'PAY123456789ABC',
    amount: 100000n,
    status: PaymentStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiredAt: new Date(Date.now() + 15 * 60 * 1000),
    paidAt: null,
  };

  function createPrismaMock() {
    return {
      payment: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        updateMany: vi.fn(),
      },
    } as unknown as PrismaService;
  }

  it('should create a payment successfully', async () => {
    const prisma = createPrismaMock();

    vi.mocked(prisma.payment.create).mockResolvedValue(createPaymentResult);

    const service = new PaymentsService(prisma, configServiceMock);

    const result = await service.create(1n, 100000);

    expect(prisma.payment.create).toHaveBeenCalledTimes(1);

    expect(result.amount).toBe('100000');
    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(result.paymentCode).toMatch(/^PAY[0-9A-F]{12}$/);
  });

  it('should retry when payment code collides', async () => {
    const prisma = createPrismaMock();

    const uniqueError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.0.0',
        meta: {
          target: ['payment_code'],
        },
      },
    );

    vi.mocked(prisma.payment.create)
      .mockRejectedValueOnce(uniqueError)
      .mockResolvedValueOnce(createPaymentResult);

    const service = new PaymentsService(prisma, configServiceMock);

    const result = await service.create(1n, 100000);

    expect(prisma.payment.create).toHaveBeenCalledTimes(2);

    expect(result.status).toBe(PaymentStatus.PENDING);
  });

  it('should throw when payment code collisions exceed retry limit', async () => {
    const prisma = createPrismaMock();

    const uniqueError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.0.0',
        meta: {
          target: ['payment_code'],
        },
      },
    );

    vi.mocked(prisma.payment.create).mockRejectedValue(uniqueError);

    const service = new PaymentsService(prisma, configServiceMock);

    await expect(service.create(1n, 100000)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(prisma.payment.create).toHaveBeenCalledTimes(5);
  });
});
