import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sender: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chat', required: true })
  chat: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message); 