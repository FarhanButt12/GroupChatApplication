import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesModule } from '../messages/messages.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiSummaryService } from './ai-summary.service';
import { SummaryController } from './summary.controller';
import { SummaryScheduler } from './summary.scheduler';
import { SchedulerWorker } from './workers/scheduler.worker';
import { SummaryWorker } from './workers/summary.worker';
import { AiWorker } from './workers/ai.worker';
import { NotificationWorker } from './workers/notification.worker';

import { QUEUES } from './summary.constants';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.SCHEDULER },
      { name: QUEUES.SUMMARY },
      { name: QUEUES.AI },
      { name: QUEUES.NOTIFICATION },
    ),
    BullModule.registerFlowProducer({
      name: QUEUES.FLOW_PRODUCER,
    }),
    PrismaModule,
    MessagesModule,
  ],
  controllers: [SummaryController],
  providers: [
    AiSummaryService,
    SummaryScheduler,
    SchedulerWorker,
    SummaryWorker,
    AiWorker,
    NotificationWorker,
  ],
  exports: [AiSummaryService, SummaryScheduler],
})
export class SummaryModule {}
