import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: 'task_created_or_updated',
  task: {
    id: 123456,
    title: 'Design Homepage',
    status: 'active',
    created_at: '2025-10-30T10:15:30Z',
    updated_at: '2025-10-30T10:20:35Z',
    assignees: [
      {
        id: 789,
        name: 'Jane Doe',
      },
    ],
    project_id: 654321,
    details: 'Details about the task...',
  },
};

export const newTask = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created or changed.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions('task_created_or_updated'),
  },
  sampleData: sampleData.task,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'task_created_or_updated') {
      return [];
    }
    return [payload.task];
  },

  async test(context) {
    return [sampleData.task];
  },
});
