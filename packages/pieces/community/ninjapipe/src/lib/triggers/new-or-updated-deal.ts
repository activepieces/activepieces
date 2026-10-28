import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../auth';
import { ninjapipeSchemas } from '../output-schemas';
import { ninjapipePolling } from './common';

const polling = ninjapipePolling.buildPolling({ path: '/deals', field: 'updated_at' });

export const newOrUpdatedDeal = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_deal',
  classification: 'READ',
  displayName: 'New or Updated Deal',
  description: 'Triggers when a deal is created or updated.',
  aiMetadata: {
    description:
      'Fires whenever a NinjaPipe deal is created or changed (value, status, links), found by polling deals sorted by updated_at. The payload is the current deal record. One deal can fire many times as it progresses.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: ninjapipeSchemas.deal,
  sampleData: {
    id: 'c5971a27-7db7-4379-afa0-2177e4006c2a',
    name: 'Enterprise plan',
    value: 5000,
    status: 'Open',
    owner_id: '01a55c1c-96af-4a4f-879b-e317def0769a',
    contact_id: null,
    company_id: null,
    fields: {},
    created_at: '2026-10-25T15:34:04.263228+00:00',
    updated_at: '2026-10-25T15:36:24.547+00:00',
  },
  props: {},
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
