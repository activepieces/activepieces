import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newOrUpdatedTask = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_task',
  displayName: 'New or Updated Task',
  description: 'Triggers when a task is created or updated.',
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', name: 'Follow-up', status: 'open', updated_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/tasks', 'updated_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/tasks', 'updated_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/tasks', 'updated_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/tasks', 'updated_at'), context);
  },
});
