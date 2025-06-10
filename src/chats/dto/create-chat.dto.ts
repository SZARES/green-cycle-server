import { IsString, IsArray, IsEnum, IsOptional, IsMongoId, MinLength, ArrayMinSize } from 'class-validator';
import { Types } from 'mongoose';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(['direct', 'group'])
  type: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsMongoId({ each: true })
  participants: Types.ObjectId[];

  @IsMongoId()
  @IsOptional()
  relatedProduct?: Types.ObjectId;
}
