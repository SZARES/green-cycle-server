import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async create(createChatDto: CreateChatDto): Promise<ChatDocument> {
    if (createChatDto.type === 'direct' && createChatDto.participants.length !== 2) {
      throw new BadRequestException('Un chat directo debe tener exactamente 2 participantes');
    }

    const chatId = new Types.ObjectId().toString();
    const chat = new this.chatModel({
      ...createChatDto,
      chatId,
      lastActivity: new Date(),
      userStatus: createChatDto.participants.map(userId => ({
        userId,
        unreadCount: 0,
        lastSeen: new Date()
      }))
    });

    return chat.save();
  }

  async findAll(): Promise<ChatDocument[]> {
    return this.chatModel.find().populate('participants').exec();
  }

  async findOne(id: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(id)
      .populate('participants')
      .populate('relatedProduct')
      .populate('lastMessage')
      .exec();

    if (!chat) {
      throw new NotFoundException(`Chat con ID ${id} no encontrado`);
    }

    return chat as ChatDocument;
  }

  async findByUser(userId: string): Promise<ChatDocument[]> {
    return this.chatModel.find({ participants: userId })
      .populate('participants')
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .exec();
  }

  async findDirectChat(user1Id: string, user2Id: string): Promise<ChatDocument | null> {
    return this.chatModel.findOne({
      type: 'direct',
      participants: { $all: [user1Id, user2Id] }
    }).populate('participants').exec();
  }

  async update(id: string, updateChatDto: UpdateChatDto): Promise<ChatDocument> {
    const chat = await this.chatModel.findByIdAndUpdate(
      id,
      { ...updateChatDto, lastActivity: new Date() },
      { new: true }
    ).populate('participants').exec();

    if (!chat) {
      throw new NotFoundException(`Chat con ID ${id} no encontrado`);
    }

    return chat as ChatDocument;
  }

  async remove(id: string): Promise<void> {
    const result = await this.chatModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Chat con ID ${id} no encontrado`);
    }
  }

  async markAsRead(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat con ID ${chatId} no encontrado`);
    }

    const userStatus = chat.userStatus.find(
      status => status.userId.toString() === userId
    );

    if (userStatus) {
      userStatus.unreadCount = 0;
      userStatus.lastSeen = new Date();
      return chat.save();
    }

    return chat as ChatDocument;
  }

  async updateLastActivity(chatId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat con ID ${chatId} no encontrado`);
    }

    chat.lastActivity = new Date();
    return chat.save();
  }

  async reportChat(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Chat con ID ${chatId} no encontrado`);
    }

    const userIdObj = new Types.ObjectId(userId);
    if (!chat.reportedBy.some(id => id.toString() === userId)) {
      chat.reportedBy.push(userIdObj);
    }

    return chat.save();
  }
}
