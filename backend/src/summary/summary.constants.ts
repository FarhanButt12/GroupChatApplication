export const QUEUES = {
  SCHEDULER: 'scheduler-queue',
  SUMMARY: 'summary-queue',
  AI: 'ai-queue',
  NOTIFICATION: 'notification-queue',
  FLOW_PRODUCER: 'summary-flow-producer',
};

export const JOB_NAMES = {
  REPEATABLE_SCHEDULER: 'chat-summary-scheduler',
  PARENT_SCHEDULER: 'daily-summary-scheduler',
  FETCH_MESSAGES: 'fetch-messages',
  GENERATE_AI_SUMMARY: 'generate-ai-summary',
  SAVE_SUMMARY: 'save-summary',
  PUBLISH_SUMMARY: 'publish-summary',
};
