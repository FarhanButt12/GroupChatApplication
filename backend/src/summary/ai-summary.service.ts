import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { SUMMARY_SYSTEM_INSTRUCTION, buildUserPrompt } from './summary.prompt';

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateGroupSummary(
    groupName: string,
    messages: { senderName: string; content: string; createdAt: Date }[],
  ): Promise<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY is missing. Using dynamic fallback summary.');
      return this.fallbackSummary(groupName, messages);
    }

    try {
      const groq = createGroq({ apiKey });
      const prompt = buildUserPrompt(groupName, messages);

      const response = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: SUMMARY_SYSTEM_INSTRUCTION,
        prompt,
      });

      return response.text.trim();
    } catch (error) {
      this.logger.error(
        `Failed to generate AI summary via Groq for group "${groupName}": ${error.message}`,
      );
      return this.fallbackSummary(groupName, messages);
    }
  }

  private fallbackSummary(
    groupName: string,
    messages: { senderName: string; content: string; createdAt: Date }[],
  ): string {
    const messageCount = messages.length;
    const senders = Array.from(new Set(messages.map((m) => m.senderName))).join(', ');
    return `🤖 Daily AI Chat Summary for "${groupName}"\n\n• Summary: ${messageCount} active messages exchanged during the past 24 hours by ${senders}.\n• Primary Focus: Channel sync & collaborative updates.\n• System Note: Automated summary.`;
  }
}
