import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EditMessageDto } from './dto/edit-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { ReactionDto } from './dto/reaction.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@Controller('groups/:id/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Send a text message in a group (Group members only)' })
  @Post()
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(userId, groupId, dto);
  }

  @ApiOperation({ summary: 'Upload a file/image attachment in a group (Group members only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        content: { type: 'string' },
      },
    },
  })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('content') content?: string,
  ) {
    return this.messagesService.sendFileMessage(userId, groupId, file, content);
  }

  @ApiOperation({ summary: 'View paginated chat history of a group' })
  @Get()
  async getGroupMessages(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagesService.getGroupMessages(userId, groupId, query);
  }

  @ApiOperation({ summary: 'Search messages in a group by keyword' })
  @Get('search')
  async searchMessages(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Query('q') query: string,
  ) {
    return this.messagesService.searchMessages(userId, groupId, query);
  }

  @ApiOperation({ summary: 'Edit a message (Message author only)' })
  @Patch(':messageId')
  async editMessage(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
  ) {
    return this.messagesService.editMessage(userId, groupId, messageId, dto.content);
  }

  @ApiOperation({ summary: 'Delete a message (Message author or Group admin only)' })
  @Delete(':messageId')
  async deleteMessage(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.deleteMessage(userId, groupId, messageId);
  }

  @ApiOperation({ summary: 'Toggle an emoji reaction on a message' })
  @Post(':messageId/react')
  async toggleReaction(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ReactionDto,
  ) {
    return this.messagesService.toggleReaction(userId, groupId, messageId, dto.emoji);
  }

  @ApiOperation({ summary: 'Mark a message as read' })
  @Post(':messageId/read')
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.markAsRead(userId, groupId, messageId);
  }
}
