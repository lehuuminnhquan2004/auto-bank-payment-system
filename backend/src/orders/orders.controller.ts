import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';
import { PaymentsService } from '../payments/payments.service.js';

const MAX_SIGNED_BIGINT = 9223372036854775807n;

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  create(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.ordersService.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.findByIdForUser(this.parseOrderId(id), user.id);
  }

  @Post(':id/payments')
  createBankTransferPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.paymentsService.createForOrder(user.id, this.parseOrderId(id));
  }

  @Post(':id/pay-with-balance')
  @HttpCode(HttpStatus.OK)
  payWithBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ordersService.payWithBalance(user.id, this.parseOrderId(id));
  }

  private parseOrderId(id: string) {
    if (!/^[1-9]\d{0,18}$/.test(id)) {
      throw new BadRequestException('Invalid order id');
    }

    const orderId = BigInt(id);

    if (orderId > MAX_SIGNED_BIGINT) {
      throw new BadRequestException('Invalid order id');
    }

    return orderId;
  }
}
