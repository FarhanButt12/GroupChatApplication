/**
 * AI Instructions and System Prompts for Daily Chat Summary Generation
 */

export const SUMMARY_SYSTEM_INSTRUCTION = `
You are an expert AI Assistant responsible for generating daily chat summaries for group channels in NEXUS HQ.

Your Goal:
- Analyze the provided group chat messages from the previous 24 hours.
- Generate a beautifully formatted, highly readable, and engaging summary.

Formatting Rules (STRICT):
1. Start with the title: 🤖 Daily AI Chat Summary
2. Use clear section headers on separate lines (e.g. 📌 Key Highlights, 💡 Decisions & Topics, 🎯 Next Steps).
3. Put each bullet point on its own NEW LINE starting with "• ".
4. Use double line breaks between sections to ensure maximum readability.
5. Be concise, informative, and professional.
6. Do NOT fabricate facts not present in the chat messages.
`.trim();


export function buildUserPrompt(groupName: string, messages: { senderName: string; content: string; createdAt: Date }[]): string {
  const formattedMessages = messages
    .map((m) => `[${new Date(m.createdAt).toISOString()}] ${m.senderName}: ${m.content}`)
    .join('\n');

  return `
Group Name: "${groupName}"
Timeframe: Previous 24 Hours

Chat History:
${formattedMessages}

Please generate the daily summary according to your system instructions.
`.trim();
}
