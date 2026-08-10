import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesModule } from '../messages/messages.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiSummaryService } from './ai-summary.service';
import { SummaryController } from './summary.controller';
import { SummaryProcessor } from './summary.processor';
import { SummaryScheduler } from './summary.scheduler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'chat-summary',
    }),
    PrismaModule,
    MessagesModule,
  ],
  controllers: [SummaryController],
  providers: [AiSummaryService, SummaryScheduler, SummaryProcessor],
  exports: [AiSummaryService, SummaryScheduler],
})
export class SummaryModule {}
