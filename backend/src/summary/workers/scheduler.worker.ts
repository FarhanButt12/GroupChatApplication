import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, InjectFlowProducer } from '@nestjs/bullmq';
import { Job, FlowProducer } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('scheduler-queue', {
  concurrency: parseInt(process.env.SCHEDULER_WORKER_CONCURRENCY || '1', 10),
})
@Injectable()
export class SchedulerWorker extends WorkerHost {
  private readonly logger = new Logger(SchedulerWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectFlowProducer('summary-flow-producer')
    private readonly flowProducer: FlowProducer,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[SchedulerWorker] Processing job '${job.name}' (ID: ${job.id}) with concurrency ${
        process.env.SCHEDULER_WORKER_CONCURRENCY || 1
      }`,
    );

    switch (job.name) {
      case 'chat-summary-scheduler':
      case 'trigger-daily-summaries':
        return this.handleSchedulerJob();
      default:
        this.logger.warn(`[SchedulerWorker] Unknown job name: ${job.name}`);
    }
  }

  private async handleSchedulerJob() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Discover active groups with message activity in the last 24 hours
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
      `[SchedulerWorker] Identified ${activeGroups.length} active group(s) with message activity in the last 24h.`,
    );

    if (activeGroups.length === 0) {
      this.logger.log('[SchedulerWorker] No active groups found for summary workflows.');
      return { activeGroupCount: 0, flowsCreated: 0 };
    }

    const createdFlows: string[] = [];

    // 2. Create BullMQ parent-child flow tree for each active group
    for (const { groupId } of activeGroups) {
      const flow = await this.flowProducer.add({
        name: 'group-summary',
        queueName: 'summary-queue',
        data: { groupId },
        children: [
          {
            name: 'publish-summary',
            queueName: 'notification-queue',
            data: { groupId },
            children: [
              {
                name: 'save-summary',
                queueName: 'summary-queue',
                data: { groupId },
                children: [
                  {
                    name: 'generate-ai-summary',
                    queueName: 'ai-queue',
                    data: { groupId },
                    children: [
                      {
                        name: 'fetch-messages',
                        queueName: 'summary-queue',
                        data: { groupId },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const parentJobId = flow.job.id;
      createdFlows.push(parentJobId);
      this.logger.log(
        `[SchedulerWorker] Enqueued group-summary workflow tree for active group ${groupId} (Parent Job ID: ${parentJobId})`,
      );
    }

    return {
      activeGroupCount: activeGroups.length,
      flowsCreated: createdFlows.length,
      parentJobIds: createdFlows,
    };
  }
}
