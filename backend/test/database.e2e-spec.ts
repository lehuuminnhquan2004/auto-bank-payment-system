import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import {
  BankTransferType,
  PaymentStatus,
  WebhookStatus,
} from '../src/generated/prisma/client.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Database integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  const runId = Date.now().toString();

  const email = `db-test-${runId}@example.test`;
  const paymentCode = `TST${runId}`;

  const transactionId1 = `TEST-${runId}-001`;
  const transactionId2 = `TEST-${runId}-002`;
  const invalidTransactionId = `TEST-${runId}-INVALID`;

  let userId: bigint;
  let paymentId: bigint;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
    }).compile();

    await moduleRef.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.webhookLog.deleteMany({
      where: {
        provider: 'TEST',
        providerTransactionId: {
          in: [transactionId1, transactionId2],
        },
      },
    });

    await prisma.bankTransaction.deleteMany({
      where: {
        provider: 'TEST',
        providerTransactionId: {
          in: [
            transactionId1,
            transactionId2,
            invalidTransactionId,
          ],
        },
      },
    });

    await prisma.payment.deleteMany({
      where: {
        paymentCode,
      },
    });

    await prisma.user.deleteMany({
      where: {
        email,
      },
    });

    await moduleRef.close();
  });

  it('should create a user', async () => {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: 'test-password-hash',
      },
    });

    userId = user.id;

    expect(user.email).toBe(email);
    expect(user.balance).toBe(0n);
  });

  it('should create a pending payment', async () => {
    const payment = await prisma.payment.create({
      data: {
        userId,
        paymentCode,
        amount: 100000n,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    paymentId = payment.id;

    expect(payment.paymentCode).toBe(paymentCode);
    expect(payment.amount).toBe(100000n);
    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.paidAt).toBeNull();
  });

  it('should allow multiple bank transactions for one payment', async () => {
    await prisma.bankTransaction.create({
      data: {
        provider: 'TEST',
        providerTransactionId: transactionId1,
        paymentId,
        bank: 'MBBank',
        transferType: BankTransferType.IN,
        amount: 50000n,
        content: paymentCode,
        transactionTime: new Date(),
        rawPayload: {
          referenceCode: transactionId1,
          amount: 50000,
        },
      },
    });

    await prisma.bankTransaction.create({
      data: {
        provider: 'TEST',
        providerTransactionId: transactionId2,
        paymentId,
        bank: 'MBBank',
        transferType: BankTransferType.IN,
        amount: 100000n,
        content: paymentCode,
        transactionTime: new Date(),
        rawPayload: {
          referenceCode: transactionId2,
          amount: 100000,
        },
      },
    });

    const transactions = await prisma.bankTransaction.findMany({
      where: {
        paymentId,
      },
    });

    expect(transactions).toHaveLength(2);
  });

  it('should reject duplicate provider transaction', async () => {
    await expect(
      prisma.bankTransaction.create({
        data: {
          provider: 'TEST',
          providerTransactionId: transactionId1,
          paymentId,
          bank: 'MBBank',
          transferType: BankTransferType.IN,
          amount: 100000n,
          content: paymentCode,
          transactionTime: new Date(),
          rawPayload: {
            referenceCode: transactionId1,
          },
        },
      }),
    ).rejects.toBeDefined();
  });

  it('should reject invalid payment foreign key', async () => {
    await expect(
      prisma.bankTransaction.create({
        data: {
          provider: 'TEST',
          providerTransactionId: invalidTransactionId,

          paymentId: 9223372036854775807n,

          bank: 'MBBank',
          transferType: BankTransferType.IN,
          amount: 100000n,
          content: paymentCode,
          transactionTime: new Date(),
          rawPayload: {
            referenceCode: invalidTransactionId,
          },
        },
      }),
    ).rejects.toBeDefined();
  });

  it('should load payment with bank transactions', async () => {
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        bankTransactions: true,
      },
    });

    expect(payment).not.toBeNull();
    expect(payment?.bankTransactions).toHaveLength(2);
  });

  it('should update payment to paid', async () => {
    const payment = await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(payment.paidAt).not.toBeNull();
  });

  it('should create webhook log', async () => {
    const webhookLog = await prisma.webhookLog.create({
      data: {
        provider: 'TEST',
        providerTransactionId: transactionId1,
        status: WebhookStatus.PROCESSED,
        payload: {
          referenceCode: transactionId1,
          amount: 100000,
        },
        processedAt: new Date(),
      },
    });

    expect(webhookLog.status).toBe(WebhookStatus.PROCESSED);
  });
});