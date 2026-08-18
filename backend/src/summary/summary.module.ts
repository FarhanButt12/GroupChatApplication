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

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scheduler-queue' },
      { name: 'summary-queue' },
      { name: 'ai-queue' },
      { name: 'notification-queue' },
    ),
    BullModule.registerFlowProducer({
      name: 'summary-flow-producer',
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
