import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newDeal = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_deal',
  displayName: 'New Deal',
  description: 'Triggers when a new deal is created.',
  aiMetadata: {
    description: 'Fires once for each deal newly created in NinjaPipe, detected by polling on the deal creation timestamp. The event payload is the created deal, including its id, name, value, and created_at. Use it to react to brand-new deals entering the pipeline; it does not fire when an existing deal is later updated.',
  },
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
