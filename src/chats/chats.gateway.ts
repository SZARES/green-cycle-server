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
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';

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

  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Validar el token y obtener el userId
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.id;
      
      if (!userId) {
        client.disconnect();
        return;
      }

      // Guardar el userId en el cliente para usarlo posteriormente
      (client as any).userId = userId;
      this.addUserSocket(userId, client);
      
      // Unirse a las salas de chat del usuario
      const userChats = await this.chatsService.findByUser(userId);
      userChats.forEach(chat => {
        client.join(chat.chatId);
      });

      console.log(`Usuario ${userId} conectado al chat`);

    } catch (error) {
      console.log('Error en conexión WebSocket:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    this.removeUserSocket(client);
    
    if (userId) {
      console.log(`Usuario ${userId} desconectado del chat`);
    }
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
    try {
    const { chatId, content } = data;
      const userId = (client as any).userId;

      if (!userId) {
        return { event: 'error', data: { message: 'Usuario no autenticado' } };
      }

      // Crear el mensaje en la base de datos
      const message = await this.messagesService.create({
        chatId,
        content,
      }, userId);

    // Emitir el mensaje a todos los usuarios en el chat
    this.server.to(chatId).emit('newMessage', {
        messageId: message._id,
      chatId,
        content: message.content,
        sender: message.sender,
        createdAt: (message as any).createdAt,
        isRead: message.isRead,
    });

      return { 
        event: 'sendMessage', 
        data: { 
          messageId: message._id,
          chatId, 
          content: message.content,
          createdAt: (message as any).createdAt,
        } 
      };
    } catch (error) {
      return { 
        event: 'error', 
        data: { message: error.message || 'Error al enviar mensaje' } 
      };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const { chatId, isTyping } = data;
    const userId = (client as any).userId;
    
    client.to(chatId).emit('userTyping', {
      chatId,
      isTyping,
      userId,
    });
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = Array.from(this.userSockets.keys());
    client.emit('onlineUsers', { users: onlineUsers });
  }

  private addUserSocket(userId: string, socket: Socket) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socket);
    this.userSockets.set(userId, sockets);
  }

  private removeUserSocket(socket: Socket) {
    this.userSockets.forEach((sockets, userId) => {
      const index = sockets.indexOf(socket);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    });
  }
} 