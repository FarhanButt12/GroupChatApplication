import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { USER_SELECT } from '../../common/constants/user-select.constant';

@Processor('summary-queue', {
  concurrency: parseInt(process.env.SUMMARY_WORKER_CONCURRENCY || '5', 10),
})
@Injectable()
export class SummaryWorker extends WorkerHost {
  private readonly logger = new Logger(SummaryWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[SummaryWorker] Processing job '${job.name}' (ID: ${job.id}) with concurrency ${
        process.env.SUMMARY_WORKER_CONCURRENCY || 5
      }`,
    );

    switch (job.name) {
      case 'fetch-messages':
        return this.handleFetchMessages(job.data.groupId);

      case 'save-summary':
        return this.handleSaveSummary(job);

      case 'group-summary':
        return this.handleParentGroupSummary(job);

      default:
        this.logger.warn(`[SummaryWorker] Unknown job name: ${job.name}`);
    }
  }

  private async handleFetchMessages(groupId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      this.logger.warn(`[SummaryWorker] Group ${groupId} not found for fetch-messages job.`);
      return { groupId, groupName: '', messages: [] };
    }

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

    const formattedMessages = messages.map((m) => ({
      senderName: m.sender.username,
      content: m.content,
      createdAt: m.createdAt,
    }));

    this.logger.log(
      `[SummaryWorker] Fetched ${formattedMessages.length} message(s) for group "${group.name}" (${groupId}).`,
    );

    return {
      groupId,
      groupName: group.name,
      messages: formattedMessages,
    };
  }

  private async handleSaveSummary(job: Job) {
    const { groupId } = job.data;
    const childrenValues = await job.getChildrenValues();
    const childResult = Object.values(childrenValues)[0] as any;

    if (!childResult || !childResult.summaryText || childResult.skipped) {
      this.logger.warn(
        `[SummaryWorker] Skipped saving summary for group ${groupId} - no valid AI summary generated.`,
      );
      return { groupId, summaryMessage: null, skipped: true };
    }

    const { summaryText } = childResult;

    // Ensure System Bot user exists
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

    this.logger.log(
      `[SummaryWorker] Saved summary message (ID: ${summaryMessage.id}) for group ${groupId}.`,
    );

    return {
      groupId,
      summaryMessage,
    };
  }

  private async handleParentGroupSummary(job: Job) {
    const { groupId } = job.data;
    const childrenValues = await job.getChildrenValues();
    this.logger.log(
      `[SummaryWorker] Parent group-summary workflow completed for group ${groupId}. Children count: ${
        Object.keys(childrenValues).length
      }`,
    );

    return {
      groupId,
      status: 'completed',
      childrenResults: childrenValues,
    };
  }
}
