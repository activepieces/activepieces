import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { ApolloRecord, apiKeyOf, recordsOf } from '../common/client';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloPolling } from '../common/polling';
import { apolloMappers, apolloRequests } from '../common/requests';

export const newAccountTrigger = createTrigger({
  auth: apolloAuth,
  name: 'new_account',
  classification: 'READ',
  displayName: 'New Account',
  description: 'Fires when an account (saved company) is created in Apollo. Needs a paid Apollo plan (account search).',
  aiMetadata: {
    description: 'Fires once for each account (saved company) created in the Apollo workspace, emitting the account record (oldest first). Polls accounts sorted by creation time and pages back to the last one it saw; accounts created by this piece also fire it.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: apolloOutputSchemas.accountItem,
  sampleData: {
    id: '6650f1a2b3c4d5e6f7a8b9d1',
    name: 'Example Inc',
    domain: 'example.com',
    organization_id: '5e66b6381e05b4008c8331b8',
    account_stage_id: '6095a710bd01d100a506d4af',
    owner_id: '6095a710bd01d100a506d4ac',
    phone: null,
    raw_address: 'Austin, Texas, United States',
    linkedin_url: null,
    source: 'api',
    created_at: '2026-11-09T10:00:00.000Z',
    typed_custom_fields: {},
    list_ids: [],
  },
  async onEnable(context) {
    if (context.isRepublish && apolloPolling.isPollState(await context.store.get(STORE_KEY))) {
      return;
    }
    await apolloPolling.initialise(pollerFor({ apiKey: apiKeyOf(context.auth), store: context.store }));
  },
  async onDisable() {
    return;
  },
  async test(context) {
    return apolloPolling.sample({ fetchPage: pageFetcher({ apiKey: apiKeyOf(context.auth) }) });
  },
  async run(context) {
    return apolloPolling.poll(pollerFor({ apiKey: apiKeyOf(context.auth), store: context.store }));
  },
});

function pageFetcher({ apiKey }: { apiKey: string }): (params: { page: number; perPage: number }) => Promise<ApolloRecord[]> {
  return async ({ page, perPage }) => {
    const response = await apolloRequests.searchAccounts({ apiKey, body: { sort_by_field: 'account_created_at', sort_ascending: false, page, per_page: perPage } });
    return recordsOf(response['accounts']).map((item) => apolloMappers.account(item));
  };
}

function pollerFor({ apiKey, store }: { apiKey: string; store: Parameters<typeof apolloPolling.poll>[0]['store'] }): Parameters<typeof apolloPolling.poll>[0] {
  return {
    fetchPage: pageFetcher({ apiKey }),
    store,
    storeKey: STORE_KEY,
    timestampOf: apolloPolling.timestampField('created_at'),
    keyOf: (item) => (typeof item['id'] === 'string' ? item['id'] : undefined),
  };
}

const STORE_KEY = 'apollo_new_account_checkpoint';
