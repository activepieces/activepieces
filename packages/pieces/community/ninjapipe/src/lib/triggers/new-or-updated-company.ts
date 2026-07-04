import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newOrUpdatedCompany = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_company',
  displayName: 'New or Updated Company',
  description: 'Triggers when a company is created or updated.',
  aiMetadata: {
    description: 'Fires whenever a company in NinjaPipe is created or has any field changed, detected by polling on the company last-updated timestamp. The event payload is the current state of the affected company, including its id, name, and updated_at. A given company can fire this multiple times as it is edited; the payload does not distinguish a first creation from a later update.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', name: 'Acme Inc', updated_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/companies', 'updated_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/companies', 'updated_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/companies', 'updated_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/companies', 'updated_at'), context);
  },
});
