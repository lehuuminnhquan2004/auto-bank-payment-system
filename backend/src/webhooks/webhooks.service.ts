import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  BankTransferType,
  PaymentStatus,
  Prisma,
} from '../generated/prisma/client.js';
import { SePayWebhookDto } from './dto/sepay-webhook.dto.js';
import { WebhookStatus } from '../generated/prisma/browser.js';
import { PrismaService } from '../prisma/prisma.service.js';

type LockedPayment = {
  id: bigint;
  user_id: bigint;
  amount: bigint;
  status: PaymentStatus;
  expired_at: Date;
};

@Injectable()
export class WebhooksService {
  private static readonly MAX_TIMESTAMP_DRIFT_SECONDS = 300;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  verifySePaySignature(
    rawBody: Buffer,
    signature: string | undefined,
    timestamp: string | undefined,
  ) {
    if (!signature || !timestamp) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const timestampNumber = Number(timestamp);

    if (!Number.isInteger(timestampNumber)) {
      throw new UnauthorizedException('Invalid webhook timestamp');
    }

    const now = Math.floor(Date.now() / 1000);

    if (
      Math.abs(now - timestampNumber) >
      WebhooksService.MAX_TIMESTAMP_DRIFT_SECONDS
    ) {
      throw new UnauthorizedException('Webhook request expired');
    }

    const secret = this.configService.getOrThrow<string>(
      'SEPAY_WEBHOOK_SECRET',
    );

    const body = rawBody.toString('utf8');

    const expectedSignature =
      'sha256=' +
      createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

    const receivedBuffer = Buffer.from(signature);

    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  //Ghi webhook vào database
  async receiveSePayWebhook(dto: SePayWebhookDto) {
    return this.prisma.webhookLog.create({
      data: {
        provider: 'SEPAY',

        providerTransactionId: dto.id.toString(),

        payload: {
          ...dto,
        },

        status: WebhookStatus.RECEIVED,
      },
    });
  }

  //Lay ra payment code từ dto.code hoặc dto.content
  private extractPaymentCode(dto: SePayWebhookDto) {
    const paymentCodeRegex = /^PAY[0-9A-F]{12}$/i;

    if (dto.code && paymentCodeRegex.test(dto.code.trim())) {
      return dto.code.trim().toUpperCase();
    }

    const contentMatch = dto.content.match(/\bPAY[0-9A-F]{12}\b/i);

    return contentMatch ? contentMatch[0].toUpperCase() : null;
  }

  //Chuyen doi transactionDate tu string sang Date
  private parseTransactionTime(transactionDate: string) {
    const date = new Date(`${transactionDate.replace(' ', 'T')}+07:00`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  //Xu ly webhook SePay
  async processSePayWebhook(webhookLogId: bigint, dto: SePayWebhookDto) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const bankTransaction = await tx.bankTransaction.create({
          data: {
            provider: 'SEPAY',

            providerTransactionId: dto.id.toString(),

            paymentId: null,

            bank: dto.gateway,

            transferType:
              dto.transferType === 'in'
                ? BankTransferType.IN
                : BankTransferType.OUT,

            amount: BigInt(dto.transferAmount),

            content: dto.content,

            transactionTime: this.parseTransactionTime(dto.transactionDate),

            rawPayload: {
              ...dto,
            },
          },
        });

        /*
         * Outgoing transaction:
         * store for audit but never process payment.
         */
        if (dto.transferType !== 'in') {
          await tx.webhookLog.update({
            where: {
              id: webhookLogId,
            },

            data: {
              status: WebhookStatus.IGNORED,

              processedAt: new Date(),

              errorMessage: 'Outgoing transaction',
            },
          });

          return;
        }

        const paymentCode = this.extractPaymentCode(dto);

        /*
         * No recognizable payment code.
         */
        if (!paymentCode) {
          await tx.webhookLog.update({
            where: {
              id: webhookLogId,
            },

            data: {
              status: WebhookStatus.IGNORED,

              processedAt: new Date(),

              errorMessage: 'Payment code not found',
            },
          });

          return;
        }

        /*
         * Lock Payment row.
         *
         * This is the first read of the Payment,
         * so concurrent webhook processing cannot
         * independently operate on stale PENDING state.
         */
        const payments = await tx.$queryRaw<LockedPayment[]>`
              SELECT
                id,
                user_id,
                amount,
                status,
                expired_at
              FROM payments
              WHERE payment_code = ${paymentCode}
              LIMIT 1
              FOR UPDATE
            `;

        const payment = payments[0];

        /*
         * No Payment for this code.
         * BankTransaction is still committed for audit.
         */
        if (!payment) {
          await tx.webhookLog.update({
            where: {
              id: webhookLogId,
            },

            data: {
              status: WebhookStatus.IGNORED,

              processedAt: new Date(),

              errorMessage: 'Payment not found',
            },
          });

          return;
        }

        /*
         * We know which payment the bank transfer
         * attempted to pay, even if validation fails.
         */
        await tx.bankTransaction.update({
          where: {
            id: bankTransaction.id,
          },

          data: {
            paymentId: payment.id,
          },
        });

        /*
         * Already processed / expired / failed.
         */
        if (payment.status !== PaymentStatus.PENDING) {
          await tx.webhookLog.update({
            where: {
              id: webhookLogId,
            },

            data: {
              status: WebhookStatus.IGNORED,

              processedAt: new Date(),

              errorMessage: `Payment status is ${payment.status}`,
            },
          });

          return;
        }

        const now = new Date();

        /*
         * Payment expired before bank transaction
         * was processed.
         */
        if (now > payment.expired_at) {
          await tx.payment.updateMany({
            where: {
              id: payment.id,

              status: PaymentStatus.PENDING,
            },

            data: {
              status: PaymentStatus.EXPIRED,
            },
          });

          await tx.webhookLog.update({
            where: {
              id: webhookLogId,
            },

            data: {
              status: WebhookStatus.IGNORED,

              processedAt: now,

              errorMessage: 'Payment expired',
            },
          });

          return;
        }

        const transferAmount = BigInt(dto.transferAmount);

        /*
         * Exact amount matching.
         */
        if (payment.amount > transferAmount) {
          await tx.webhookLog.update({
            where: {
              id: webhookLogId,
            },

            data: {
              status: WebhookStatus.IGNORED,

              processedAt: now,

              errorMessage: 'Transferred amount is less than required',
            },
          });

          return;
        }

        /*
         * Defense in depth:
         * even though the row is locked,
         * update only if it is still PENDING
         * and still not expired.
         */
        const updateResult = await tx.payment.updateMany({
          where: {
            id: payment.id,

            status: PaymentStatus.PENDING,

            expiredAt: {
              gte: now,
            },
          },

          data: {
            status: PaymentStatus.PAID,

            paidAt: now,
          },
        });

        if (updateResult.count !== 1) {
          await tx.webhookLog.update({
            where: {
              id: webhookLogId,
            },

            data: {
              status: WebhookStatus.IGNORED,

              processedAt: now,

              errorMessage: 'Payment is no longer payable',
            },
          });

          return;
        }

        /*
         * Balance update is in the SAME transaction.
         */
        await tx.user.update({
          where: {
            id: payment.user_id,
          },

          data: {
            balance: {
              increment: payment.amount,
            },
          },
        });

        await tx.webhookLog.update({
          where: {
            id: webhookLogId,
          },

          data: {
            status: WebhookStatus.PROCESSED,

            processedAt: now,

            errorMessage: null,
          },
        });
      });
    } catch (error) {
      /*
       * provider + provider_transaction_id
       * UNIQUE constraint:
       *
       * duplicate SePay webhook.
       */
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        await this.prisma.webhookLog.update({
          where: {
            id: webhookLogId,
          },

          data: {
            status: WebhookStatus.DUPLICATE,

            processedAt: new Date(),

            errorMessage: 'Duplicate bank transaction',
          },
        });

        return;
      }

      /*
       * Unexpected system/database error.
       *
       * Best-effort logging, then rethrow so
       * SePay receives non-2xx and can retry.
       */
      try {
        await this.prisma.webhookLog.update({
          where: {
            id: webhookLogId,
          },

          data: {
            status: WebhookStatus.FAILED,

            processedAt: new Date(),

            errorMessage:
              error instanceof Error
                ? error.message
                : 'Unknown processing error',
          },
        });
      } catch {
        /*
         * Do not hide the original error if
         * updating the log also fails.
         */
      }

      throw error;
    }
  }
}
