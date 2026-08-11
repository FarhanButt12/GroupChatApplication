import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SummaryScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(SummaryScheduler.name);

  constructor(@InjectQueue('scheduler-queue') private readonly schedulerQueue: Queue) {}

  async onApplicationBootstrap() {
    await this.registerRepeatableJob();
  }

  /**
   * Registers a repeatable BullMQ job running once every 24 hours on scheduler-queue.
   */
  async registerRepeatableJob() {
    try {
      await this.schedulerQueue.upsertJobScheduler(
        'chat-summary-scheduler',
        {
          every: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        },
        {
          name: 'chat-summary-scheduler',
          data: {},
        },
      );

      this.logger.log(
        'Registered repeatable BullMQ job: chat-summary-scheduler on scheduler-queue (runs every 24h)',
      );
    } catch (error) {
      this.logger.error(`Failed to register repeatable job: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual trigger method for immediate testing/verification
   */
  async triggerDailySummaryNow() {
    this.logger.log('Manually triggering daily summary job execution on scheduler-queue');
    const job = await this.schedulerQueue.add('trigger-daily-summaries', {
      triggeredAt: new Date().toISOString(),
    });
    return { status: 'triggered', jobId: job.id, queue: 'scheduler-queue' };
  }
}
