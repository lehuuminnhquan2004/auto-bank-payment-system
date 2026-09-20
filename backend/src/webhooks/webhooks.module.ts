import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';
import { WebhooksController } from './webhooks.controller.js';

@Module({
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
