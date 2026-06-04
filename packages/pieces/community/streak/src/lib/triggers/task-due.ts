import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const taskDueTrigger = createPipelineWebhookTrigger({
  name: 'task_due',
  displayName: 'Task Due',
  description:
    'Triggers when a task becomes due (but has not yet been completed) on a box in the selected pipeline.',
  event: 'TASK_DUE',
  sampleData: {
    key: 'agxzfm1haWxmb29nYWVyMQsSBFRhc2sYgICAwI_oogow',
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    text: 'Send follow-up email to buyer.',
    status: 'NOT_DONE',
    dueDate: 1714248000000,
  },
});
