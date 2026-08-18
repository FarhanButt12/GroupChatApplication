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
    // 1. Authorization check: user must be a group member
    await this.checkMembership(userId, groupId);

    // 2. Save message to database
    const message = await this.prisma.message.create({
      data: {
        content: dto.content.trim(),
        groupId,
        senderId: userId,
      },
      include: {
        sender: {
          select: USER_SELECT,
        },
      },
    });

    // 3. Real-time emit to all connected WebSocket clients in the group room
    this.chatGateway.broadcastMessage(groupId, message);

    return {
      message: 'Message sent successfully',
      data: message,
    };
  }

  async getGroupMessages(
    userId: string,
    groupId: string,
    query: GetMessagesQueryDto,
  ) {
    // 1. Authorization check: user must be a group member
    await this.checkMembership(userId, groupId);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    // 2. Fetch paginated messages with composite index support (groupId, createdAt)
    const [messages, totalCount] = await Promise.all([
      this.prisma.message.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' }, // Latest messages first
        skip,
        take: limit,
        include: {
          sender: {
            select: USER_SELECT,
          },
        },
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
}
