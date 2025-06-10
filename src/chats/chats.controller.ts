import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CurrentUser } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatsService.create(createChatDto);
  }

  @Get()
  findAll() {
    return this.chatsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.chatsService.findByUser(userId);
  }

  @Get('direct')
  findDirectChat(
    @Query('user1Id') user1Id: string,
    @Query('user2Id') user2Id: string,
  ) {
    return this.chatsService.findDirectChat(user1Id, user2Id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatsService.update(id, updateChatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatsService.remove(id);
  }

  @Post(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatsService.markAsRead(id, userId);
  }

  @Post(':id/report')
  reportChat(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatsService.reportChat(id, userId);
  }
}
