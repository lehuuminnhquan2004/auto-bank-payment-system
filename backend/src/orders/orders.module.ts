import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [AuthModule, PaymentsModule],

  controllers: [OrdersController],

  providers: [OrdersService],
})
export class OrdersModule {}
