import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SummaryScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(SummaryScheduler.name);

  constructor(@InjectQueue('chat-summary') private readonly summaryQueue: Queue) {}

  async onApplicationBootstrap() {
    await this.registerRepeatableJob();
  }

  /**
   * Registers a repeatable BullMQ job running once every 24 hours.
   */
  async registerRepeatableJob() {
    try {
      // BullMQ v5+ upsertJobScheduler creates or updates the 24-hour job schedule cleanly
      await this.summaryQueue.upsertJobScheduler(
        'chat-summary-scheduler',
        {
          every: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        },
        {
          name: 'chat-summary-scheduler',
          data: {},
        },
      );

      this.logger.log('Registered repeatable BullMQ job: chat-summary-scheduler (runs every 24h)');
    } catch (error) {
      this.logger.error(`Failed to register repeatable job: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual trigger method for immediate testing/verification
   */
  async triggerDailySummaryNow() {
    this.logger.log('Manually triggering daily summary job execution');
    const job = await this.summaryQueue.add('trigger-daily-summaries', {
      triggeredAt: new Date().toISOString(),
    });
    return { status: 'triggered', jobId: job.id };
  }
}
