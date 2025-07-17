import { IsString, IsNotEmpty, MaxLength, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'El mensaje no puede exceder los 1000 caracteres' })
  content: string;

  @IsMongoId()
  @IsNotEmpty()
  chatId: string;
} 