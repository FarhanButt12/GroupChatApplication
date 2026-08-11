import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiSummaryService } from '../ai-summary.service';

@Processor('ai-queue', {
  concurrency: parseInt(process.env.AI_WORKER_CONCURRENCY || '10', 10),
})
@Injectable()
export class AiWorker extends WorkerHost {
  private readonly logger = new Logger(AiWorker.name);

  constructor(private readonly aiSummaryService: AiSummaryService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[AiWorker] Processing job '${job.name}' (ID: ${job.id}) with concurrency ${
        process.env.AI_WORKER_CONCURRENCY || 10
      }`,
    );

    switch (job.name) {
      case 'generate-ai-summary':
        return this.handleGenerateAiSummary(job);

      default:
        this.logger.warn(`[AiWorker] Unknown job name: ${job.name}`);
    }
  }

  private async handleGenerateAiSummary(job: Job) {
    const { groupId } = job.data;
    const childrenValues = await job.getChildrenValues();
    const childResult = Object.values(childrenValues)[0] as any;

    if (!childResult || !childResult.messages || childResult.messages.length === 0) {
      this.logger.log(
        `[AiWorker] Skipped AI summary generation for group ${groupId} - no messages in child job result.`,
      );
      return {
        groupId,
        groupName: childResult?.groupName || '',
        summaryText: null,
        skipped: true,
      };
    }

    const { groupName, messages } = childResult;

    this.logger.log(
      `[AiWorker] Generating Groq AI summary for group "${groupName}" (${messages.length} messages)...`,
    );

    const summaryText = await this.aiSummaryService.generateGroupSummary(
      groupName,
      messages,
    );

    this.logger.log(
      `[AiWorker] Successfully generated AI summary for group "${groupName}" (${groupId}).`,
    );

    return {
      groupId,
      groupName,
      summaryText,
    };
  }
}
