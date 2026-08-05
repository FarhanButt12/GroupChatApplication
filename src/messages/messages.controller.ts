import { Body, Controller, Get, Param, Post, Query, UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@Controller('groups/:id/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @ApiOperation({ summary: 'Send a message in a group (Group members only)' })
  @Post()
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(userId, groupId, dto);
  }

  @ApiOperation({ summary: 'View paginated chat history of a group (Group members only)' })
  @Get()
  async getGroupMessages(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagesService.getGroupMessages(userId, groupId, query);
  }
}
