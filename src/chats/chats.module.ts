import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { Chat, ChatSchema } from './entities/chat.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema }
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tu_clave_secreta_super_segura',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ChatsController, MessagesController],
  providers: [ChatsService, MessagesService, ChatsGateway],
  exports: [ChatsService, MessagesService]
})
export class ChatsModule {}
