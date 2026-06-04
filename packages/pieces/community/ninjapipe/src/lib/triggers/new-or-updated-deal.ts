import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newOrUpdatedDeal = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_deal',
  displayName: 'New or Updated Deal',
  description: 'Triggers when a deal is created or updated.',
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', name: 'Enterprise Plan', value: 5000, updated_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/deals', 'updated_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/deals', 'updated_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/deals', 'updated_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/deals', 'updated_at'), context);
  },
});
