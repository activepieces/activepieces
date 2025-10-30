import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: 'task_label.created',
  task_label: {
    id: 123456,
    name: 'Urgent',
    color: '#FF5533',
    project_id: 78910,
    created_at: '2025-10-30T11:40:00.000Z',
    updated_at: '2025-10-30T11:40:00.000Z',
  },
};

export const newTaskLabel = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a task label is created.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions('task_label.created'),
  },
  sampleData: sampleData.task_label,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'task_label.created') return [];
    return [payload.task_label];
  },

  async test(context) {
    return [sampleData.task_label];
  },
});
