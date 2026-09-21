import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  WebhookStatus,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

type OrderFixture = {
  userId: bigint;
  orderId: bigint;
  totalAmount: bigint;
  initialBalance: bigint;
  token: string;
};

type WebhookPayload = {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string;
  code: string;
  content: string;
  transferType: 'in';
  description: string;
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
};

describe('Order bank-transfer payment flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let webhookSecret: string;

  const userIds: bigint[] = [];
  const productIds: bigint[] = [];
  const orderIds: bigint[] = [];
  const sepayIds: string[] = [];

  let nextTransactionId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
    jwtService = app.get(JwtService);
    webhookSecret = app
      .get(ConfigService)
      .getOrThrow<string>('SEPAY_WEBHOOK_SECRET');
  });

  afterAll(async () => {
    if (sepayIds.length > 0) {
      await prisma.webhookLog.deleteMany({
        where: {
          provider: 'SEPAY',
          providerTransactionId: { in: sepayIds },
        },
      });

      await prisma.bankTransaction.deleteMany({
        where: {
          provider: 'SEPAY',
          providerTransactionId: { in: sepayIds },
        },
      });
    }

    if (orderIds.length > 0) {
      await prisma.payment.deleteMany({
        where: {
          orderId: { in: orderIds },
        },
      });

      await prisma.orderItem.deleteMany({
        where: {
          orderId: { in: orderIds },
        },
      });

      await prisma.order.deleteMany({
        where: {
          id: { in: orderIds },
        },
      });
    }

    if (productIds.length > 0) {
      await prisma.product.deleteMany({
        where: {
          id: { in: productIds },
        },
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: userIds },
        },
      });
    }

    await app.close();
  });

  async function createOrderFixture(
    initialBalance: bigint,
    totalAmount: bigint,
  ): Promise<OrderFixture> {
    const suffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;

    const user = await prisma.user.create({
      data: {
        email: `order-payment-${suffix}@example.com`,
        passwordHash: 'test-password-hash',
        balance: initialBalance,
      },
    });

    userIds.push(user.id);

    const product = await prisma.product.create({
      data: {
        name: `Sản phẩm test ${suffix}`,
        price: totalAmount,
      },
    });

    productIds.push(product.id);

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        checkoutKey: randomUUID(),
        requestHash: randomBytes(32).toString('hex'),
        status: OrderStatus.PENDING,
        totalAmount,
        items: {
          create: {
            productId: product.id,
            productNameSnapshot: product.name,
            unitPriceSnapshot: product.price,
            quantity: 1,
            subtotal: product.price,
          },
        },
      },
    });

    orderIds.push(order.id);

    const token = await jwtService.signAsync({
      sub: user.id.toString(),
    });

    return {
      userId: user.id,
      orderId: order.id,
      totalAmount,
      initialBalance,
      token,
    };
  }

  function createWebhookPayload(
    paymentCode: string,
    amount: bigint,
  ): WebhookPayload {
    nextTransactionId += 1;

    const id = nextTransactionId;

    sepayIds.push(id.toString());

    return {
      id,
      gateway: 'MBBank',
      transactionDate: '2026-09-21 12:00:00',
      accountNumber: '123456789',
      subAccount: '',
      code: paymentCode,
      content: paymentCode,
      transferType: 'in',
      description: 'Order payment test',
      transferAmount: Number(amount),
      accumulated: Number(amount),
      referenceCode: `FT${id}`,
    };
  }

  function sendWebhook(payload: WebhookPayload) {
    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature =
      'sha256=' +
      createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

    return request(app.getHttpServer())
      .post('/api/webhooks/sepay')
      .set('Content-Type', 'application/json')
      .set('X-SePay-Timestamp', timestamp)
      .set('X-SePay-Signature', signature)
      .send(rawBody);
  }

  it('creates one bank Payment and webhook marks the Order as PAID', async () => {
    const fixture = await createOrderFixture(250000n, 59000n);

    const createResponse = await request(app.getHttpServer())
      .post(`/api/orders/${fixture.orderId}/payments`)
      .set('Authorization', `Bearer ${fixture.token}`)
      .expect(201);

    expect(createResponse.body).toMatchObject({
      orderId: fixture.orderId.toString(),
      method: PaymentMethod.BANK_TRANSFER,
      amount: fixture.totalAmount.toString(),
      status: PaymentStatus.PENDING,
    });
    expect(createResponse.body.paymentCode).toMatch(/^PAY[0-9A-F]{12}$/);
    expect(createResponse.body.expiredAt).not.toBeNull();
    expect(createResponse.body.qrUrl).toContain(
      encodeURIComponent(createResponse.body.paymentCode),
    );

    const duplicateResponse = await request(app.getHttpServer())
      .post(`/api/orders/${fixture.orderId}/payments`)
      .set('Authorization', `Bearer ${fixture.token}`)
      .expect(409);

    expect(duplicateResponse.body.message).toBe('Order already has a payment');

    const payment = await prisma.payment.findUniqueOrThrow({
      where: {
        orderId: fixture.orderId,
      },
    });

    const webhookResponse = await sendWebhook(
      createWebhookPayload(payment.paymentCode, payment.amount),
    );

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body).toEqual({ success: true });

    const updatedPayment = await prisma.payment.findUniqueOrThrow({
      where: {
        id: payment.id,
      },
    });
    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: fixture.orderId,
      },
    });
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: fixture.userId,
      },
    });

    expect(updatedPayment.status).toBe(PaymentStatus.PAID);
    expect(updatedPayment.paidAt).not.toBeNull();
    expect(updatedOrder.status).toBe(OrderStatus.PAID);
    expect(updatedOrder.paidAt).not.toBeNull();
    expect(updatedUser.balance).toBe(fixture.initialBalance);

    const webhookLog = await prisma.webhookLog.findFirst({
      where: {
        provider: 'SEPAY',
        providerTransactionId: sepayIds.at(-1),
      },
    });

    expect(webhookLog?.status).toBe(WebhookStatus.PROCESSED);
  });

  it('expires both Payment and Order when the Payment is read after expiry', async () => {
    const fixture = await createOrderFixture(150000n, 79000n);

    const createResponse = await request(app.getHttpServer())
      .post(`/api/orders/${fixture.orderId}/payments`)
      .set('Authorization', `Bearer ${fixture.token}`)
      .expect(201);

    const paymentId = BigInt(createResponse.body.id);

    await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        expiredAt: new Date(Date.now() - 1000),
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/api/payments/${paymentId}`)
      .set('Authorization', `Bearer ${fixture.token}`)
      .expect(200);

    expect(response.body.status).toBe(PaymentStatus.EXPIRED);

    const expiredPayment = await prisma.payment.findUniqueOrThrow({
      where: {
        id: paymentId,
      },
    });
    const expiredOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: fixture.orderId,
      },
    });
    const unchangedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: fixture.userId,
      },
    });

    expect(expiredPayment.status).toBe(PaymentStatus.EXPIRED);
    expect(expiredOrder.status).toBe(OrderStatus.EXPIRED);
    expect(expiredOrder.paidAt).toBeNull();
    expect(unchangedUser.balance).toBe(fixture.initialBalance);
  });

  it('cancels a pending Order and ignores a later webhook', async () => {
    const fixture = await createOrderFixture(350000n, 99000n);

    await request(app.getHttpServer())
      .post(`/api/orders/${fixture.orderId}/payments`)
      .set('Authorization', `Bearer ${fixture.token}`)
      .expect(201);

    const payment = await prisma.payment.findUniqueOrThrow({
      where: {
        orderId: fixture.orderId,
      },
    });

    const cancelResponse = await request(app.getHttpServer())
      .post(`/api/orders/${fixture.orderId}/cancel`)
      .set('Authorization', `Bearer ${fixture.token}`)
      .expect(200);

    expect(cancelResponse.body).toMatchObject({
      id: fixture.orderId.toString(),
      status: OrderStatus.CANCELLED,
      paymentId: payment.id.toString(),
      paymentStatus: PaymentStatus.CANCELLED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
    });
    expect(cancelResponse.body.cancelledAt).not.toBeNull();

    const secondCancelResponse = await request(app.getHttpServer())
      .post(`/api/orders/${fixture.orderId}/cancel`)
      .set('Authorization', `Bearer ${fixture.token}`)
      .expect(409);

    expect(secondCancelResponse.body.message).toBe('Order is not pending');

    const webhookResponse = await sendWebhook(
      createWebhookPayload(payment.paymentCode, payment.amount),
    );

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body).toEqual({ success: true });

    const cancelledPayment = await prisma.payment.findUniqueOrThrow({
      where: {
        id: payment.id,
      },
    });
    const cancelledOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: fixture.orderId,
      },
    });
    const unchangedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: fixture.userId,
      },
    });

    expect(cancelledPayment.status).toBe(PaymentStatus.CANCELLED);
    expect(cancelledPayment.paidAt).toBeNull();
    expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);
    expect(cancelledOrder.cancelledAt).not.toBeNull();
    expect(cancelledOrder.paidAt).toBeNull();
    expect(unchangedUser.balance).toBe(fixture.initialBalance);

    const webhookLog = await prisma.webhookLog.findFirst({
      where: {
        provider: 'SEPAY',
        providerTransactionId: sepayIds.at(-1),
      },
    });

    expect(webhookLog?.status).toBe(WebhookStatus.IGNORED);
    expect(webhookLog?.errorMessage).toBe('Payment status is CANCELLED');
  });
});
