import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../entities/order.entity';

class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  totalPrice: number;
}

class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsOptional()
  country?: string = 'Perú';
}

class ExchangeDetailsDto {
  @IsArray()
  @IsMongoId({ each: true })
  offeredProductIds: string[];

  @IsString()
  @IsNotEmpty()
  exchangeTerms: string;
}

export class CreateOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  buyerId: string;

  @IsMongoId()
  @IsNotEmpty()
  sellerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxes?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingCost?: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsEnum(OrderType)
  orderType: OrderType;

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsObject()
  @IsOptional()
  paymentDetails?: Record<string, any>;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExchangeDetailsDto)
  exchangeDetails?: ExchangeDetailsDto;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  sellerNotes?: string;
}
