import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Message } from './message.entity';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: String, required: true })
  chatId: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }])
  participants: User[];

  @Prop({ type: String, enum: ['direct', 'group'], default: 'direct' })
  type: string;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' })
  relatedProduct?: Product;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message' })
  lastMessage?: Message;

  @Prop({ type: Date })
  lastActivity: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop([{
    userId: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
    unreadCount: { type: Number, default: 0 },
    lastSeen: { type: Date, default: Date.now }
  }])
  userStatus: Array<{
    userId: User;
    unreadCount: number;
    lastSeen: Date;
  }>;

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  reportedBy: Types.ObjectId[];
}

const ChatSchema = SchemaFactory.createForClass(Chat);

// Índices
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastActivity: -1 });
ChatSchema.index({ 'userStatus.userId': 1 });

// Métodos del modelo
ChatSchema.statics.findChatsByUser = function(userId: string) {
  return this.find({ participants: userId }).sort({ lastActivity: -1 });
};

ChatSchema.statics.findDirectChat = function(user1Id: string, user2Id: string) {
  return this.findOne({
    type: 'direct',
    participants: { $all: [user1Id, user2Id] }
  });
};

ChatSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

ChatSchema.methods.markAsRead = function(userId: string) {
  const userStatus = this.userStatus.find(status => status.userId.toString() === userId);
  if (userStatus) {
    userStatus.unreadCount = 0;
    userStatus.lastSeen = new Date();
    return this.save();
  }
};

export { ChatSchema };
