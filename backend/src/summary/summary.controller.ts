import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SummaryScheduler } from './summary.scheduler';

@ApiTags('Chat Summary')
@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryScheduler: SummaryScheduler) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger daily AI summary generation for active groups' })
  @ApiResponse({ status: 200, description: 'Summary job enqueued successfully' })
  async triggerSummary() {
    return this.summaryScheduler.triggerDailySummaryNow();
  }
}
