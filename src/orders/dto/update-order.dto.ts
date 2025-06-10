import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../entities/order.entity';
import { Type } from 'class-transformer';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  cancelReason?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  confirmedAt?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  shippedAt?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deliveredAt?: Date;
}
