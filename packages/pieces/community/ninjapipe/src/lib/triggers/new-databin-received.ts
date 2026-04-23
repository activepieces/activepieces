import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newDatabinReceived = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_databin_received',
  displayName: 'New Databin Received',
  description: 'Triggers when a new Databin response is received.',
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', type: 'databin', created_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/responses', 'created_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/responses', 'created_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/responses', 'created_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/responses', 'created_at'), context);
  },
});
