import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { Chat, ChatDocument } from './entities/chat.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async create(createMessageDto: CreateMessageDto, senderId: string): Promise<MessageDocument> {
    // Verificar que el chat existe y el usuario es participante
    const chat = await this.chatModel.findById(createMessageDto.chatId);
    if (!chat) {
      throw new NotFoundException(`Chat con ID ${createMessageDto.chatId} no encontrado`);
    }

    // Verificar que el usuario es participante del chat
    const isParticipant = chat.participants.some(
      participant => participant.toString() === senderId
    );
    if (!isParticipant) {
      throw new ForbiddenException('No tienes permisos para enviar mensajes en este chat');
    }

    // Crear el mensaje
    const message = new this.messageModel({
      content: createMessageDto.content,
      sender: senderId,
      chat: createMessageDto.chatId,
      isRead: false,
    });

    const savedMessage = await message.save();

    // Actualizar el chat con el último mensaje y actividad
    await this.chatModel.findByIdAndUpdate(createMessageDto.chatId, {
      lastMessage: savedMessage._id,
      lastActivity: new Date(),
    });

    // Incrementar contador de mensajes no leídos para otros participantes
    await this.updateUnreadCounts(createMessageDto.chatId, senderId);

    // Poblar el sender antes de retornar
    return savedMessage.populate('sender', 'name email profileImage');
  }

  async findByChat(chatId: string, userId: string, page: number = 1, limit: number = 50): Promise<{
    messages: MessageDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Verificar que el chat existe y el usuario es participante
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat con ID ${chatId} no encontrado`);
    }

    const isParticipant = chat.participants.some(
      participant => participant.toString() === userId
    );
    if (!isParticipant) {
      throw new ForbiddenException('No tienes permisos para ver los mensajes de este chat');
    }

    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ chat: chatId })
        .populate('sender', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ chat: chatId }),
    ]);

    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException(`Mensaje con ID ${messageId} no encontrado`);
    }

    // Solo el receptor puede marcar como leído (no el emisor)
    if (message.sender.toString() === userId) {
      throw new ForbiddenException('No puedes marcar tu propio mensaje como leído');
    }

    // Verificar que el usuario es participante del chat
    const chat = await this.chatModel.findById(message.chat);
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }
    
    const isParticipant = chat.participants.some(
      participant => participant.toString() === userId
    );
    if (!isParticipant) {
      throw new ForbiddenException('No tienes permisos para marcar este mensaje como leído');
    }

    message.isRead = true;
    return message.save();
  }

  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    // Verificar que el chat existe y el usuario es participante
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat con ID ${chatId} no encontrado`);
    }

    const isParticipant = chat.participants.some(
      participant => participant.toString() === userId
    );
    if (!isParticipant) {
      throw new ForbiddenException('No tienes permisos para marcar este chat como leído');
    }

    // Marcar todos los mensajes del chat como leídos para este usuario
    await this.messageModel.updateMany(
      { 
        chat: chatId, 
        sender: { $ne: userId },
        isRead: false 
      },
      { isRead: true }
    );

    // Resetear contador de no leídos en el chat
    const userStatus = chat.userStatus.find(
      status => status.userId.toString() === userId
    );
    if (userStatus) {
      userStatus.unreadCount = 0;
      userStatus.lastSeen = new Date();
      await chat.save();
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException(`Mensaje con ID ${messageId} no encontrado`);
    }

    // Solo el emisor puede eliminar su mensaje
    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('Solo puedes eliminar tus propios mensajes');
    }

    await this.messageModel.deleteOne({ _id: messageId });

    // Si era el último mensaje del chat, actualizar el chat
    const chat = await this.chatModel.findById(message.chat);
    if (chat && chat.lastMessage?.toString() === messageId) {
      const lastMessage = await this.messageModel
        .findOne({ chat: message.chat })
        .sort({ createdAt: -1 })
        .exec();
      
      chat.lastMessage = lastMessage as any;
      await chat.save();
    }
  }

  private async updateUnreadCounts(chatId: string, senderId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) return;

    // Incrementar contador para todos los participantes excepto el emisor
    chat.userStatus.forEach(status => {
      if (status.userId.toString() !== senderId) {
        status.unreadCount += 1;
      }
    });

    await chat.save();
  }
} 