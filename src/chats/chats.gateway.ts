import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { ChatsService } from './chats.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket[]> = new Map();

  constructor(private readonly chatsService: ChatsService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Aquí deberías validar el token y obtener el userId
      const userId = 'userId'; // Reemplazar con la lógica real de validación
      this.addUserSocket(userId, client);
      
      // Unirse a las salas de chat del usuario
      const userChats = await this.chatsService.findByUser(userId);
      userChats.forEach(chat => {
        client.join(chat.chatId);
      });

    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.removeUserSocket(client);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ) {
    client.join(chatId);
    return { event: 'joinChat', data: { chatId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ) {
    client.leave(chatId);
    return { event: 'leaveChat', data: { chatId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content: string },
  ) {
    const { chatId, content } = data;
    
    // Aquí deberías crear el mensaje en la base de datos
    // const message = await this.messagesService.create({
    //   chatId,
    //   content,
    //   sender: userId,
    // });

    // Emitir el mensaje a todos los usuarios en el chat
    this.server.to(chatId).emit('newMessage', {
      chatId,
      content,
      // ...otros datos del mensaje
    });

    return { event: 'sendMessage', data: { chatId, content } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const { chatId, isTyping } = data;
    client.to(chatId).emit('userTyping', {
      chatId,
      isTyping,
      userId: 'userId', // Reemplazar con el ID real del usuario
    });
  }

  private addUserSocket(userId: string, socket: Socket) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socket);
    this.userSockets.set(userId, sockets);
  }

  private removeUserSocket(socket: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(socket);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }
} 