import { pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesPolling } from '../common/record-polling';
import { accountOutputSchema } from '../output-schemas';

export const newAccount = createTrigger({
  auth: freshsalesAuth,
  name: 'new_account',
  displayName: 'New Account',
  description: 'Triggers when a new account is created',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when a new account (company) is created in Freshsales. Polls the All accounts view sorted by creation time; each event is one new account record.',
  },
  outputSchema: accountOutputSchema,
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  sampleData: {
    id: 16000000100,
    name: 'Acme Inc',
    website: 'https://acme.com',
    phone: '+15550100',
    city: 'Austin',
    country: 'USA',
    owner_id: 16000000001,
    industry_type_id: 16000000400,
    annual_revenue: 5000000,
    number_of_employees: 120,
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:05:00Z',
    custom_field: {},
  },
});

const polling = freshsalesPolling.buildPolling({
  entity: 'sales_accounts',
  timestampField: 'created_at',
});
