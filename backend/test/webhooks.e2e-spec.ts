import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import {
  PaymentStatus,
  WebhookStatus,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('SePay Webhook (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let configService: ConfigService;

  let webhookSecret: string;

  const runId = Date.now();

  const sepayTransactionId = runId;
  const paymentCode = `PAY${runId
    .toString(16)
    .toUpperCase()
    .padStart(12, '0')
    .slice(-12)}`;

  let userId: bigint;
  let paymentId: bigint;

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
    configService = app.get(ConfigService);

    webhookSecret =
      configService.getOrThrow<string>(
        'SEPAY_WEBHOOK_SECRET',
      );

    /*
     * Create test user directly in DB.
     */
    const user = await prisma.user.create({
      data: {
        email: `webhook-test-${runId}@example.com`,
        passwordHash: 'test-password-hash',
      },
    });

    userId = user.id;

    /*
     * Create a PENDING payment.
     *
     * Important:
     * Phase 6 webhook must NOT change this payment to PAID.
     */
    const payment = await prisma.payment.create({
      data: {
        userId,
        paymentCode,
        amount: 100000n,
        status: PaymentStatus.PENDING,
        expiredAt: new Date(
          Date.now() + 15 * 60 * 1000,
        ),
      },
    });

    paymentId = payment.id;
  });

  afterAll(async () => {
    /*
     * Delete webhook logs first.
     */
    await prisma.webhookLog.deleteMany({
      where: {
        provider: 'SEPAY',
        providerTransactionId:
          sepayTransactionId.toString(),
      },
    });

    /*
     * Phase 6 should not create BankTransaction,
     * but cleanup defensively in case later implementation changes.
     */
    await prisma.bankTransaction.deleteMany({
      where: {
        provider: 'SEPAY',
        providerTransactionId:
          sepayTransactionId.toString(),
      },
    });

    await prisma.payment.deleteMany({
      where: {
        id: paymentId,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: userId,
      },
    });

    await app.close();
  });

  function createPayload() {
    return {
      id: sepayTransactionId,

      gateway: 'MBBank',

      transactionDate:
        '2026-09-06 20:00:00',

      accountNumber: '123456789',

      subAccount: '',

      code: null,

      content: paymentCode,

      transferType: 'in',

      description: 'Test bank transfer',

      transferAmount: 100000,

      accumulated: 100000,

      referenceCode:
        `FT${sepayTransactionId}`,
    };
  }

  function createSignature(
    rawBody: string,
    timestamp: string,
  ) {
    return (
      'sha256=' +
      createHmac(
        'sha256',
        webhookSecret,
      )
        .update(
          `${timestamp}.${rawBody}`,
        )
        .digest('hex')
    );
  }

  it('POST /api/webhooks/sepay should return 401 without signature', async () => {
    const payload = createPayload();

    const rawBody = JSON.stringify(payload);

    const timestamp = Math.floor(
      Date.now() / 1000,
    ).toString();

    await request(app.getHttpServer())
      .post('/api/webhooks/sepay')
      .set(
        'Content-Type',
        'application/json',
      )
      .set(
        'X-SePay-Timestamp',
        timestamp,
      )
      .send(rawBody)
      .expect(401);
  });

  it('POST /api/webhooks/sepay should return 401 without timestamp', async () => {
    const payload = createPayload();

    const rawBody = JSON.stringify(payload);

    const timestamp = Math.floor(
      Date.now() / 1000,
    ).toString();

    const signature =
      createSignature(
        rawBody,
        timestamp,
      );

    await request(app.getHttpServer())
      .post('/api/webhooks/sepay')
      .set(
        'Content-Type',
        'application/json',
      )
      .set(
        'X-SePay-Signature',
        signature,
      )
      .send(rawBody)
      .expect(401);
  });

  it('POST /api/webhooks/sepay should return 401 for expired timestamp', async () => {
    const payload = createPayload();

    const rawBody = JSON.stringify(payload);

    /*
     * 10 minutes old.
     * Current implementation allows only 5 minutes.
     */
    const timestamp = Math.floor(
      Date.now() / 1000 - 600,
    ).toString();

    const signature =
      createSignature(
        rawBody,
        timestamp,
      );

    await request(app.getHttpServer())
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
      .send(rawBody)
      .expect(401);
  });

  it('POST /api/webhooks/sepay should return 401 for invalid signature', async () => {
    const payload = createPayload();

    const rawBody = JSON.stringify(payload);

    const timestamp = Math.floor(
      Date.now() / 1000,
    ).toString();

    await request(app.getHttpServer())
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
        'sha256=invalid-signature',
      )
      .send(rawBody)
      .expect(401);
  });

  it('POST /api/webhooks/sepay should return 400 for invalid payload', async () => {
    const payload = {
      ...createPayload(),

      transferAmount: -100000,
    };

    const rawBody = JSON.stringify(payload);

    const timestamp = Math.floor(
      Date.now() / 1000,
    ).toString();

    const signature =
      createSignature(
        rawBody,
        timestamp,
      );

    await request(app.getHttpServer())
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
      .send(rawBody)
      .expect(400);
  });

  it('POST /api/webhooks/sepay should accept valid HMAC without JWT', async () => {
    const payload = createPayload();

    const rawBody = JSON.stringify(payload);

    const timestamp = Math.floor(
      Date.now() / 1000,
    ).toString();

    const signature =
      createSignature(
        rawBody,
        timestamp,
      );

    const response =
      await request(
        app.getHttpServer(),
      )
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
        .send(rawBody)
        .expect(200);

    expect(
      response.body.success,
    ).toBe(true);
  });

  it('should create WebhookLog with RECEIVED status', async () => {
    const webhookLog =
      await prisma.webhookLog.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayTransactionId.toString(),
        },
      });

    expect(webhookLog).not.toBeNull();

    expect(webhookLog?.status).toBe(
      WebhookStatus.RECEIVED,
    );

    expect(
      webhookLog?.providerTransactionId,
    ).toBe(
      sepayTransactionId.toString(),
    );

    expect(
      webhookLog?.processedAt,
    ).toBeNull();

    expect(
      webhookLog?.errorMessage,
    ).toBeNull();
  });

  it('should store webhook payload', async () => {
    const webhookLog =
      await prisma.webhookLog.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayTransactionId.toString(),
        },
      });

    expect(webhookLog).not.toBeNull();

    const payload =
      webhookLog?.payload as Record<
        string,
        unknown
      >;

    expect(payload.id).toBe(
      sepayTransactionId,
    );

    expect(payload.gateway).toBe(
      'MBBank',
    );

    expect(payload.content).toBe(
      paymentCode,
    );

    expect(
      payload.transferAmount,
    ).toBe(100000);
  });

  it('should not mark Payment as PAID in Phase 6', async () => {
    const payment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: paymentId,
        },
      });

    expect(payment.status).toBe(
      PaymentStatus.PENDING,
    );

    expect(payment.paidAt).toBeNull();

    expect(payment.amount).toBe(
      100000n,
    );
  });

  it('should not create BankTransaction in Phase 6', async () => {
    const transaction =
      await prisma.bankTransaction.findFirst({
        where: {
          provider: 'SEPAY',
          providerTransactionId:
            sepayTransactionId.toString(),
        },
      });

    expect(transaction).toBeNull();
  });
});