import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe 
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.create(createMessageDto, userId);
  }

  @Get('chat/:chatId')
  findByChat(
    @Param('chatId') chatId: string,
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.findByChat(chatId, userId, page, limit);
  }

  @Post(':id/read')
  markAsRead(
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.markAsRead(messageId, userId);
  }

  @Post('chat/:chatId/read-all')
  markChatAsRead(
    @Param('chatId') chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.markChatAsRead(chatId, userId);
  }

  @Delete(':id')
  deleteMessage(
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.deleteMessage(messageId, userId);
  }
} 