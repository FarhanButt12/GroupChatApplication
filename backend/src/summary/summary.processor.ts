import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../messages/chat.gateway';
import { AiSummaryService } from './ai-summary.service';
import { USER_SELECT } from '../common/constants/user-select.constant';

@Processor('chat-summary')
@Injectable()
export class SummaryProcessor extends WorkerHost {
  private readonly logger = new Logger(SummaryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly aiSummaryService: AiSummaryService,
    @InjectQueue('chat-summary') private readonly summaryQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing BullMQ job '${job.name}' (ID: ${job.id})`);

    switch (job.name) {
      case 'chat-summary-scheduler':
      case 'trigger-daily-summaries':
        return this.handleSchedulerJob();

      case 'generate-group-summary':
        return this.handleGroupSummaryJob(job.data.groupId);

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSchedulerJob() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Query distinct active groups with messages in the last 24 hours
    const activeGroups = await this.prisma.message.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        groupId: true,
      },
      distinct: ['groupId'],
    });

    this.logger.log(
      `Scheduler identified ${activeGroups.length} active group(s) with messages in the last 24 hours.`,
    );

    // 2. Enqueue individual summary job for each active group
    for (const { groupId } of activeGroups) {
      await this.summaryQueue.add('generate-group-summary', { groupId });
      this.logger.log(`Enqueued summary job for active group ${groupId}`);
    }

    return { activeGroupCount: activeGroups.length };
  }

  private async handleGroupSummaryJob(groupId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      this.logger.warn(`Group ${groupId} not found for summary job.`);
      return;
    }

    // Fetch messages from the last 24 hours
    const messages = await this.prisma.message.findMany({
      where: {
        groupId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      include: {
        sender: {
          select: USER_SELECT,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (messages.length === 0) {
      this.logger.log(`No recent messages found for group "${group.name}" (${groupId}).`);
      return;
    }

    const formattedMessages = messages.map((m) => ({
      senderName: m.sender.username,
      content: m.content,
      createdAt: m.createdAt,
    }));

    // Generate AI Summary text using imported prompt instructions & Groq API
    const summaryText = await this.aiSummaryService.generateGroupSummary(
      group.name,
      formattedMessages,
    );

    // Ensure System Bot sender user exists
    let systemUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: 'Nexus AI Bot' }, { email: 'system.bot@nexus.hq' }],
      },
    });

    if (!systemUser) {
      systemUser = await this.prisma.user.create({
        data: {
          email: 'system.bot@nexus.hq',
          username: 'Nexus AI Bot',
          password: 'system_bot_protected_password_hash',
        },
      });
    }

    // Save generated summary message to PostgreSQL database
    const summaryMessage = await this.prisma.message.create({
      data: {
        content: summaryText,
        groupId,
        senderId: systemUser.id,
      },
      include: {
        sender: {
          select: USER_SELECT,
        },
      },
    });

    // Broadcast live to connected users via existing ChatGateway
    this.chatGateway.broadcastMessage(groupId, summaryMessage);

    this.logger.log(
      `Successfully generated and broadcasted daily summary for group "${group.name}"`,
    );
    return { groupId, summaryId: summaryMessage.id };
  }
}
