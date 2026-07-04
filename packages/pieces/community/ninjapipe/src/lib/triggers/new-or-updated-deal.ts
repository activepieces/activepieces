import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newOrUpdatedDeal = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_deal',
  displayName: 'New or Updated Deal',
  description: 'Triggers when a deal is created or updated.',
  aiMetadata: {
    description: 'Fires whenever a deal in NinjaPipe is created or has any field changed, detected by polling on the deal last-updated timestamp. The event payload is the current state of the affected deal, including its id, name, value, and updated_at. A given deal can fire this multiple times as it moves through the pipeline; the payload does not distinguish a first creation from a later update.',
  },
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
