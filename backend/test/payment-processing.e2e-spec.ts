import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createHmac,
  randomBytes,
} from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import {
  PaymentStatus,
  WebhookStatus,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

type WebhookPayload = {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string;
  code: string | null;
  content: string;
  transferType: 'in' | 'out';
  description: string;
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
};

describe('Automatic Payment Processing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let webhookSecret: string;

  const userIds: bigint[] = [];
  const paymentIds: bigint[] = [];
  const sepayIds: string[] = [];

  let nextTransactionId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication({
      rawBody: true,
    });

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    const configService =
      app.get(ConfigService);

    webhookSecret =
      configService.getOrThrow<string>(
        'SEPAY_WEBHOOK_SECRET',
      );
  });

  afterAll(async () => {
    await prisma.webhookLog.deleteMany({
      where: {
        provider: 'SEPAY',
        providerTransactionId: {
          in: sepayIds,
        },
      },
    });

    await prisma.bankTransaction.deleteMany({
      where: {
        provider: 'SEPAY',
        providerTransactionId: {
          in: sepayIds,
        },
      },
    });

    await prisma.payment.deleteMany({
      where: {
        id: {
          in: paymentIds,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });

    await app.close();
  });

  function nextSePayId() {
    nextTransactionId += 1;

    const id = nextTransactionId;

    sepayIds.push(id.toString());

    return id;
  }

  function createPaymentCode() {
    return `PAY${randomBytes(6)
      .toString('hex')
      .toUpperCase()}`;
  }

  async function createUser(
    balance = 0n,
  ) {
    const user =
      await prisma.user.create({
        data: {
          email:
            `payment-processing-${Date.now()}-` +
            `${randomBytes(4).toString('hex')}@example.com`,

          passwordHash:
            'test-password-hash',

          balance,
        },
      });

    userIds.push(user.id);

    return user;
  }

  async function createPayment(
    userId: bigint,
    amount: bigint,
    expiredAt = new Date(
      Date.now() + 15 * 60 * 1000,
    ),
  ) {
    const payment =
      await prisma.payment.create({
        data: {
          userId,
          paymentCode:
            createPaymentCode(),

          amount,

          status:
            PaymentStatus.PENDING,

          expiredAt,
        },
      });

    paymentIds.push(payment.id);

    return payment;
  }

  function createPayload(
    id: number,
    paymentCode: string,
    amount: number,
    overrides: Partial<WebhookPayload> = {},
  ): WebhookPayload {
    return {
      id,

      gateway: 'MBBank',

      transactionDate:
        '2026-09-10 00:00:00',

      accountNumber: '123456789',

      subAccount: '',

      code: paymentCode,

      content: paymentCode,

      transferType: 'in',

      description:
        'Test bank transaction',

      transferAmount: amount,

      accumulated: amount,

      referenceCode: `FT${id}`,

      ...overrides,
    };
  }

  async function sendWebhook(
    payload: WebhookPayload,
  ) {
    const rawBody =
      JSON.stringify(payload);

    const timestamp = Math.floor(
      Date.now() / 1000,
    ).toString();

    const signature =
      'sha256=' +
      createHmac(
        'sha256',
        webhookSecret,
      )
        .update(
          `${timestamp}.${rawBody}`,
        )
        .digest('hex');

    return request(app.getHttpServer())
      .post('/api/webhooks/sepay')
      .set(
        'Content-Type',
        'application/json',
      )
      .set(
        'X-SePay-Timestamp',
        timestamp,
      )
      .set(
        'X-SePay-Signature',
        signature,
      )
      .send(rawBody);
  }

  it('should mark Payment as PAID and increase balance', async () => {
    const user = await createUser();

    const payment =
      await createPayment(
        user.id,
        100000n,
      );

    const sepayId = nextSePayId();

    const response =
      await sendWebhook(
        createPayload(
          sepayId,
          payment.paymentCode,
          100000,
        ),
      );

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
    });

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    expect(updatedPayment.status).toBe(
      PaymentStatus.PAID,
    );

    expect(
      updatedPayment.paidAt,
    ).not.toBeNull();

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    expect(updatedUser.balance).toBe(
      100000n,
    );

    const bankTransaction =
      await prisma.bankTransaction.findUnique({
        where: {
          provider_providerTransactionId: {
            provider: 'SEPAY',
            providerTransactionId:
              sepayId.toString(),
          },
        },
      });

    expect(bankTransaction).not.toBeNull();

    expect(
      bankTransaction?.paymentId,
    ).toBe(payment.id);

    const webhookLog =
      await prisma.webhookLog.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(webhookLog?.status).toBe(
      WebhookStatus.PROCESSED,
    );
  });

  it('should not process duplicate SePay transaction twice', async () => {
    const user = await createUser();

    const payment =
      await createPayment(
        user.id,
        100000n,
      );

    const sepayId = nextSePayId();

    const payload = createPayload(
      sepayId,
      payment.paymentCode,
      100000,
    );

    const firstResponse =
      await sendWebhook(payload);

    expect(
      firstResponse.status,
    ).toBe(200);

    const secondResponse =
      await sendWebhook(payload);

    expect(
      secondResponse.status,
    ).toBe(200);

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    /*
     * Must only be incremented once.
     */
    expect(updatedUser.balance).toBe(
      100000n,
    );

    const transactionCount =
      await prisma.bankTransaction.count({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(transactionCount).toBe(1);

    const logs =
      await prisma.webhookLog.findMany({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(logs).toHaveLength(2);

    expect(
      logs.some(
        (log) =>
          log.status ===
          WebhookStatus.PROCESSED,
      ),
    ).toBe(true);

    expect(
      logs.some(
        (log) =>
          log.status ===
          WebhookStatus.DUPLICATE,
      ),
    ).toBe(true);
  });

  it('should ignore transaction when amount does not match', async () => {
    const user = await createUser();

    const payment =
      await createPayment(
        user.id,
        100000n,
      );

    const sepayId = nextSePayId();

    const response =
      await sendWebhook(
        createPayload(
          sepayId,
          payment.paymentCode,
          50000,
        ),
      );

    expect(response.status).toBe(200);

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    expect(updatedPayment.status).toBe(
      PaymentStatus.PENDING,
    );

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    expect(updatedUser.balance).toBe(0n);

    const transaction =
      await prisma.bankTransaction.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    /*
     * Transaction is still linked for audit.
     */
    expect(transaction?.paymentId).toBe(
      payment.id,
    );

    const log =
      await prisma.webhookLog.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(log?.status).toBe(
      WebhookStatus.IGNORED,
    );
  });

  it('should expire Payment when transaction arrives after expiration', async () => {
    const user = await createUser();

    const payment =
      await createPayment(
        user.id,
        100000n,
        new Date(
          Date.now() - 60_000,
        ),
      );

    const sepayId = nextSePayId();

    const response =
      await sendWebhook(
        createPayload(
          sepayId,
          payment.paymentCode,
          100000,
        ),
      );

    expect(response.status).toBe(200);

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    expect(updatedPayment.status).toBe(
      PaymentStatus.EXPIRED,
    );

    expect(updatedPayment.paidAt).toBeNull();

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    expect(updatedUser.balance).toBe(0n);
  });

  it('should store unmatched transaction with paymentId = null', async () => {
    const sepayId = nextSePayId();

    const unknownCode =
      createPaymentCode();

    const response =
      await sendWebhook(
        createPayload(
          sepayId,
          unknownCode,
          100000,
        ),
      );

    expect(response.status).toBe(200);

    const transaction =
      await prisma.bankTransaction.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(transaction).not.toBeNull();

    expect(transaction?.paymentId).toBeNull();

    const log =
      await prisma.webhookLog.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(log?.status).toBe(
      WebhookStatus.IGNORED,
    );
  });

  it('should ignore outgoing transaction', async () => {
    const user = await createUser();

    const payment =
      await createPayment(
        user.id,
        100000n,
      );

    const sepayId = nextSePayId();

    const response =
      await sendWebhook(
        createPayload(
          sepayId,
          payment.paymentCode,
          100000,
          {
            transferType: 'out',
          },
        ),
      );

    expect(response.status).toBe(200);

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    expect(updatedPayment.status).toBe(
      PaymentStatus.PENDING,
    );

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    expect(updatedUser.balance).toBe(0n);

    const transaction =
      await prisma.bankTransaction.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(transaction).not.toBeNull();

    /*
     * Current implementation returns before
     * matching Payment for OUT transactions.
     */
    expect(transaction?.paymentId).toBeNull();
  });

  it('should not increase balance when Payment is already PAID', async () => {
    const user = await createUser();

    const payment =
      await createPayment(
        user.id,
        100000n,
      );

    const firstId = nextSePayId();

    await sendWebhook(
      createPayload(
        firstId,
        payment.paymentCode,
        100000,
      ),
    );

    const secondId = nextSePayId();

    const secondResponse =
      await sendWebhook(
        createPayload(
          secondId,
          payment.paymentCode,
          100000,
        ),
      );

    expect(
      secondResponse.status,
    ).toBe(200);

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    /*
     * First transaction increments balance.
     * Second transaction must not.
     */
    expect(updatedUser.balance).toBe(
      100000n,
    );

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    expect(updatedPayment.status).toBe(
      PaymentStatus.PAID,
    );

    const transactions =
      await prisma.bankTransaction.findMany({
        where: {
          paymentId: payment.id,
        },
      });

    /*
     * Both real bank transactions are kept
     * for audit.
     */
    expect(transactions).toHaveLength(2);

    const secondLog =
      await prisma.webhookLog.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            secondId.toString(),
        },
      });

    expect(secondLog?.status).toBe(
      WebhookStatus.IGNORED,
    );
  });

  it('should process only one of two concurrent transactions for the same Payment', async () => {
    const user = await createUser();

    const payment =
      await createPayment(
        user.id,
        100000n,
      );

    const firstId = nextSePayId();
    const secondId = nextSePayId();

    const firstPayload =
      createPayload(
        firstId,
        payment.paymentCode,
        100000,
      );

    const secondPayload =
      createPayload(
        secondId,
        payment.paymentCode,
        100000,
      );

    /*
     * Send two DIFFERENT bank transactions
     * against the same Payment concurrently.
     */
    const [
      firstResponse,
      secondResponse,
    ] = await Promise.all([
      sendWebhook(firstPayload),
      sendWebhook(secondPayload),
    ]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    expect(updatedPayment.status).toBe(
      PaymentStatus.PAID,
    );

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    /*
     * Critical assertion:
     *
     * balance must only increase once.
     */
    expect(updatedUser.balance).toBe(
      100000n,
    );

    const transactions =
      await prisma.bankTransaction.findMany({
        where: {
          paymentId: payment.id,
        },
      });

    /*
     * Both bank transactions exist for audit.
     */
    expect(transactions).toHaveLength(2);

    const logs =
      await prisma.webhookLog.findMany({
        where: {
          provider: 'SEPAY',
          providerTransactionId: {
            in: [
              firstId.toString(),
              secondId.toString(),
            ],
          },
        },
      });

    expect(logs).toHaveLength(2);

    const processedCount =
      logs.filter(
        (log) =>
          log.status ===
          WebhookStatus.PROCESSED,
      ).length;

    const ignoredCount =
      logs.filter(
        (log) =>
          log.status ===
          WebhookStatus.IGNORED,
      ).length;

    expect(processedCount).toBe(1);
    expect(ignoredCount).toBe(1);
  });

  it('should rollback Payment and BankTransaction when balance update fails', async () => {
    /*
     * Maximum signed MySQL BIGINT.
     *
     * Incrementing this value by 1 should
     * fail with an out-of-range database error.
     */
    const maxBigInt =
      9223372036854775807n;

    const user =
      await createUser(maxBigInt);

    const payment =
      await createPayment(
        user.id,
        1n,
      );

    const sepayId = nextSePayId();

    const response =
      await sendWebhook(
        createPayload(
          sepayId,
          payment.paymentCode,
          1,
        ),
      );

    /*
     * Unexpected DB/system error should be
     * returned as non-2xx so SePay may retry.
     */
    expect(response.status).toBeGreaterThanOrEqual(
      500,
    );

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    /*
     * PENDING -> PAID must have rolled back.
     */
    expect(updatedPayment.status).toBe(
      PaymentStatus.PENDING,
    );

    expect(updatedPayment.paidAt).toBeNull();

    const updatedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

    expect(updatedUser.balance).toBe(
      maxBigInt,
    );

    /*
     * BankTransaction insert was inside the
     * same transaction and must also rollback.
     */
    const transaction =
      await prisma.bankTransaction.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(transaction).toBeNull();

    /*
     * WebhookLog exists outside the business
     * transaction and should be marked FAILED.
     */
    const log =
      await prisma.webhookLog.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayId.toString(),
        },
      });

    expect(log?.status).toBe(
      WebhookStatus.FAILED,
    );
  });
});