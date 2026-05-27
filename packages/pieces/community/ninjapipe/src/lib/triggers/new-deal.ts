import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newDeal = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_deal',
  displayName: 'New Deal',
  description: 'Triggers when a new deal is created.',
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', name: 'Enterprise Plan', value: 5000, created_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/deals', 'created_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/deals', 'created_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/deals', 'created_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/deals', 'created_at'), context);
  },
});
