import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../auth';
import { ninjapipeSchemas } from '../output-schemas';
import { ninjapipePolling } from './common';

const polling = ninjapipePolling.buildPolling({ path: '/deals', field: 'created_at' });

export const newDeal = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_deal',
  classification: 'READ',
  displayName: 'New Deal',
  description: 'Triggers when a deal is created.',
  aiMetadata: {
    description:
      'Fires once for each newly created NinjaPipe deal, found by polling deals sorted by created_at. The payload is the deal record: id, name, value, status, owner_id, contact_id, company_id, fields and timestamps.',
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
