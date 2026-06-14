import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const taskCompletedTrigger = createPipelineWebhookTrigger({
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggers when a task on a box in the selected pipeline is marked complete.',
  aiMetadata: {
    description:
      'Fires when a task on a box in the selected pipeline is marked complete, representing a to-do item being finished on a CRM record.',
  },
  event: 'TASK_COMPLETE',
  sampleData: {
    key: 'agxzfm1haWxmb29nYWVyMQsSBFRhc2sYgICAwI_oogow',
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    text: 'Send follow-up email to buyer.',
    status: 'DONE',
    completedAt: 1714248000000,
  },
});
