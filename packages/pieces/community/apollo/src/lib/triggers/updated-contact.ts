import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { ApolloRecord, apiKeyOf, recordsOf } from '../common/client';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloPolling } from '../common/polling';
import { apolloMappers, apolloRequests } from '../common/requests';

export const updatedContactTrigger = createTrigger({
  auth: apolloAuth,
  name: 'updated_contact',
  classification: 'READ',
  displayName: 'Updated Contact',
  description: 'Fires when a contact is created or updated in Apollo. The piece\'s own Update Contact action also fires it, so avoid updating the same contact from this flow. Needs a paid Apollo plan (contact search).',
  aiMetadata: {
    description: 'Fires once for each new version of a contact in the Apollo workspace (any change to the contact, including creation), emitting the latest contact record oldest first. Several edits between two polls fire once. Updates made by this piece also fire it, which can loop a flow that updates the contact it received.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: apolloOutputSchemas.contactItem,
  sampleData: {
    id: '6650f1a2b3c4d5e6f7a8b9c0',
    first_name: 'Jane',
    last_name: 'Doe',
    name: 'Jane Doe',
    title: 'Head of Sales',
    email: 'jane.doe@example.com',
    email_status: 'verified',
    organization_name: 'Example Inc',
    organization_id: '5e66b6381e05b4008c8331b8',
    account_id: '6650f1a2b3c4d5e6f7a8b9d1',
    contact_stage_id: '6095a710bd01d100a506d4ae',
    owner_id: '6095a710bd01d100a506d4ac',
    person_id: null,
    linkedin_url: null,
    present_raw_address: 'Austin, Texas, United States',
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
    time_zone: 'America/Chicago',
    source: 'api',
    created_at: '2026-11-09T10:00:00.000Z',
    updated_at: '2026-11-09T10:00:00.000Z',
    last_activity_date: null,
    typed_custom_fields: {},
    phone: null,
    list_ids: [],
    sequence_ids: [],
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
    const response = await apolloRequests.searchContacts({ apiKey, body: { sort_by_field: 'contact_updated_at', sort_ascending: false, page, per_page: perPage } });
    return recordsOf(response['contacts']).map((item) => apolloMappers.contact(item));
  };
}

function pollerFor({ apiKey, store }: { apiKey: string; store: Parameters<typeof apolloPolling.poll>[0]['store'] }): Parameters<typeof apolloPolling.poll>[0] {
  return {
    fetchPage: pageFetcher({ apiKey }),
    store,
    storeKey: STORE_KEY,
    timestampOf: apolloPolling.timestampField('updated_at'),
    keyOf: (item) => (typeof item['id'] === 'string' ? `${item['id']}|${String(item['updated_at'])}` : undefined),
  };
}

const STORE_KEY = 'apollo_updated_contact_checkpoint';
