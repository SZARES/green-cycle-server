import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsEnum, IsObject, ValidateNested, Min, Max, MinLength, MaxLength, IsMongoId, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCondition, ProductStatus } from '../entities/product.entity';

class LocationDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsObject()
  @IsOptional()
  coordinates?: {
    lat: number;
    lng: number;
  };
}

class ShippingOptionsDto {
  @IsBoolean()
  @IsOptional()
  localPickup?: boolean = true;

  @IsBoolean()
  @IsOptional()
  homeDelivery?: boolean = false;

  @IsBoolean()
  @IsOptional()
  shipping?: boolean = false;

  @IsNumber()
  @IsOptional()
  shippingCost?: number;
}

class MetadataDto {
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1)
  @MaxLength(10)
  images: string[];

  @IsMongoId()
  category: string;

  @IsMongoId()
  @IsOptional()
  subcategory?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number = 0;

  @IsString()
  @IsOptional()
  currency?: string = 'PEN';

  @IsBoolean()
  @IsOptional()
  forBarter?: boolean = false;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  barterPreferences?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number = 0;

  @IsString()
  @IsOptional()
  stockUnit?: string = 'unidad';

  @IsBoolean()
  @IsOptional()
  isUnlimitedStock?: boolean = false;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(5)
  @IsOptional()
  ecoBadges?: string[];

  @IsNumber()
  @IsOptional()
  ecoSaving?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  sustainabilityScore?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  materials?: string[];

  @IsBoolean()
  @IsOptional()
  isHandmade?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isOrganic?: boolean = false;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingOptionsDto)
  @IsOptional()
  shippingOptions?: ShippingOptionsDto;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @IsMongoId()
  @IsOptional()
  seller: any;

  @IsBoolean()
  @IsOptional()
  isVerifiedSeller?: boolean = false;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  searchKeywords?: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => MetadataDto)
  @IsOptional()
  metadata?: MetadataDto;
}
