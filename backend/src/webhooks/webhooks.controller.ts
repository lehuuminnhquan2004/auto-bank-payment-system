import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

import type { RawBodyRequest } from '@nestjs/common';
import { SePayWebhookDto } from './dto/sepay-webhook.dto.js';
import { WebhooksService } from './webhooks.service.js';



@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('sepay')
  @HttpCode(HttpStatus.OK)
  async handleSePayWebhook(
    @Req()
    request: RawBodyRequest<Request>,

    @Headers('x-sepay-signature')
    signature: string | undefined,

    @Headers('x-sepay-timestamp')
    timestamp: string | undefined,

    @Body()
    dto: SePayWebhookDto,
  ) {
    if (!request.rawBody) {
      throw new Error(
        'Raw request body is unavailable',
      );
    }

    this.webhooksService.verifySePaySignature(
      request.rawBody,
      signature,
      timestamp,
    );
    
    const webhookLog = await this.webhooksService.receiveSePayWebhook(
      dto,
    );


    await this.webhooksService.processSePayWebhook(
      webhookLog.id,
      dto,
    );

    return {
      success: true,
    };
  }
}