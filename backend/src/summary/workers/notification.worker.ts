import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ChatGateway } from '../../messages/chat.gateway';

@Processor('notification-queue', {
  concurrency: parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY || '3', 10),
})
@Injectable()
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private readonly chatGateway: ChatGateway) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[NotificationWorker] Processing job '${job.name}' (ID: ${job.id}) with concurrency ${
        process.env.NOTIFICATION_WORKER_CONCURRENCY || 3
      }`,
    );

    switch (job.name) {
      case 'publish-summary':
        return this.handlePublishSummary(job);

      default:
        this.logger.warn(`[NotificationWorker] Unknown job name: ${job.name}`);
    }
  }

  private async handlePublishSummary(job: Job) {
    const { groupId } = job.data;
    const childrenValues = await job.getChildrenValues();
    const childResult = Object.values(childrenValues)[0] as any;

    if (!childResult || !childResult.summaryMessage || childResult.skipped) {
      this.logger.warn(
        `[NotificationWorker] Skipped broadcasting summary for group ${groupId} - no valid saved summary message.`,
      );
      return { groupId, published: false, skipped: true };
    }

    const { summaryMessage } = childResult;

    // Broadcast live to connected users via existing ChatGateway
    this.chatGateway.broadcastMessage(groupId, summaryMessage);

    this.logger.log(
      `[NotificationWorker] Successfully broadcasted summary message (ID: ${summaryMessage.id}) to group ${groupId} via Socket.IO.`,
    );

    return {
      groupId,
      published: true,
      summaryMessageId: summaryMessage.id,
    };
  }
}
