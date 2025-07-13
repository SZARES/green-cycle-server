import { IsString, IsArray, IsBoolean, IsDate, IsOptional } from 'class-validator';

export class UploadResponseDto {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;

  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  uploadedBy: string;

  @IsDate()
  uploadedAt: Date;
}

export class DeleteResponseDto {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;

  @IsString()
  deletedBy: string;

  @IsDate()
  deletedAt: Date;
}

export class DeleteImagesDto {
  @IsArray()
  @IsString({ each: true })
  publicIds: string[];
} 