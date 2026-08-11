import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_SELECT } from '../common/constants/user-select.constant';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';

const MESSAGE_INCLUDE = {
  sender: {
    select: USER_SELECT,
  },
  reactions: {
    include: {
      user: {
        select: USER_SELECT,
      },
    },
  },
  readReceipts: {
    include: {
      user: {
        select: USER_SELECT,
      },
    },
  },
};

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
  ) {}

  // Helper method to verify group membership authorization
  private async checkMembership(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID '${groupId}' not found`);
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Access denied. You must join this group to send or view messages.',
      );
    }

    return { group, membership };
  }

  async sendMessage(userId: string, groupId: string, dto: SendMessageDto) {
    await this.checkMembership(userId, groupId);

    const message = await this.prisma.message.create({
      data: {
        content: dto.content.trim(),
        groupId,
        senderId: userId,
      },
      include: MESSAGE_INCLUDE,
    });

    this.chatGateway.broadcastMessage(groupId, message);

    return {
      message: 'Message sent successfully',
      data: message,
    };
  }

  async sendFileMessage(
    userId: string,
    groupId: string,
    file: Express.Multer.File,
    content?: string,
  ) {
    await this.checkMembership(userId, groupId);

    const isImage = file.mimetype.startsWith('image/');
    const fileType = isImage ? 'image' : 'document';
    const fileUrl = `/uploads/${file.filename}`;

    const message = await this.prisma.message.create({
      data: {
        content: (content || file.originalname).trim(),
        groupId,
        senderId: userId,
        fileUrl,
        fileType,
        fileName: file.originalname,
      },
      include: MESSAGE_INCLUDE,
    });

    this.chatGateway.broadcastMessage(groupId, message);

    return {
      message: 'File message sent successfully',
      data: message,
    };
  }

  async getGroupMessages(
    userId: string,
    groupId: string,
    query: GetMessagesQueryDto,
  ) {
    await this.checkMembership(userId, groupId);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [messages, totalCount] = await Promise.all([
      this.prisma.message.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: MESSAGE_INCLUDE,
      }),
      this.prisma.message.count({
        where: { groupId },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: messages,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async editMessage(
    userId: string,
    groupId: string,
    messageId: string,
    content: string,
  ) {
    await this.checkMembership(userId, groupId);

    const existingMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage || existingMessage.groupId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    if (existingMessage.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (existingMessage.isDeleted) {
      throw new ForbiddenException('Cannot edit a deleted message');
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
      },
      include: MESSAGE_INCLUDE,
    });

    this.chatGateway.broadcastMessageUpdate(groupId, updatedMessage);

    return {
      message: 'Message updated successfully',
      data: updatedMessage,
    };
  }

  async deleteMessage(userId: string, groupId: string, messageId: string) {
    const { membership } = await this.checkMembership(userId, groupId);

    const existingMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage || existingMessage.groupId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    const isAuthor = existingMessage.senderId === userId;
    const isAdmin = membership.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: 'This message was deleted',
        isDeleted: true,
        fileUrl: null,
        fileName: null,
        fileType: null,
      },
      include: MESSAGE_INCLUDE,
    });

    this.chatGateway.broadcastMessageUpdate(groupId, updatedMessage);

    return {
      message: 'Message deleted successfully',
      data: updatedMessage,
    };
  }

  async toggleReaction(
    userId: string,
    groupId: string,
    messageId: string,
    emoji: string,
  ) {
    await this.checkMembership(userId, groupId);

    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      await this.prisma.reaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      await this.prisma.reaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    const updatedMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: MESSAGE_INCLUDE,
    });

    this.chatGateway.broadcastMessageUpdate(groupId, updatedMessage);

    return {
      message: 'Reaction updated',
      data: updatedMessage,
    };
  }

  async markAsRead(userId: string, groupId: string, messageId: string) {
    await this.checkMembership(userId, groupId);

    const existingReceipt = await this.prisma.readReceipt.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (!existingReceipt) {
      await this.prisma.readReceipt.create({
        data: {
          messageId,
          userId,
        },
      });
    }

    const updatedMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: MESSAGE_INCLUDE,
    });

    this.chatGateway.broadcastMessageUpdate(groupId, updatedMessage);

    return {
      message: 'Message marked as read',
      data: updatedMessage,
    };
  }

  async searchMessages(userId: string, groupId: string, query: string) {
    await this.checkMembership(userId, groupId);

    if (!query || query.trim().length === 0) {
      return { data: [] };
    }

    const messages = await this.prisma.message.findMany({
      where: {
        groupId,
        content: {
          contains: query.trim(),
          mode: 'insensitive',
        },
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: MESSAGE_INCLUDE,
    });

    return { data: messages };
  }
}
