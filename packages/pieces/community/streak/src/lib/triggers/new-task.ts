import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const newTaskTrigger = createPipelineWebhookTrigger({
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created on a box in the selected pipeline.',
  event: 'TASK_CREATE',
  sampleData: {
    key: 'agxzfm1haWxmb29nYWVyMQsSBFRhc2sYgICAwI_oogow',
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    text: 'Send follow-up email to buyer.',
    status: 'NOT_DONE',
    dueDate: 1714248000000,
    creatorKey: 'agxzfm1haWxmb29nYWVyMQsSBFVzZXIY3AYM',
    creationDate: 1714080000000,
  },
});
