import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newTask = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created.',
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', name: 'Follow-up', status: 'open', created_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/tasks', 'created_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/tasks', 'created_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/tasks', 'created_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/tasks', 'created_at'), context);
  },
});
