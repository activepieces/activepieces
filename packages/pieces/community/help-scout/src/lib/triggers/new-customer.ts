import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi, StoredWebhook } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const newCustomer = createTrigger({
  auth: helpScoutAuth,
  name: 'new_customer',
  classification: 'READ',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is added.',
  aiMetadata: {
    description:
      'Fires when a new customer record is created in Help Scout (customer.created webhook event), representing a newly registered contact across all mailboxes.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  outputSchema: helpScoutOutputSchemas['customerWebhook'],
  sampleData: {
    id: 333333,
    firstName: 'Jane',
    lastName: 'Doe',
    gender: 'unknown',
    jobTitle: 'Office Manager',
    location: 'Austin, TX',
    organization: 'Acme Inc',
    photoUrl: '',
    photoType: 'unknown',
    background: '',
    age: '',
    createdAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
    _embedded: {
      emails: [{ id: 1, value: 'jane@example.com', type: 'work' }],
      phones: [],
      social_profiles: [],
    },
  },
  async onEnable(context) {
    const stored = await helpScoutApi.createWebhook({
      auth: context.auth,
      url: context.webhookUrl,
      events: ['customer.created'],
    });
    await context.store.put<StoredWebhook>(WEBHOOK_KEY, stored);
  },
  async onDisable(context) {
    const stored = await context.store.get<StoredWebhook>(WEBHOOK_KEY);
    if (stored?.webhookId) {
      await helpScoutApi.deleteWebhook({ auth: context.auth, webhookId: stored.webhookId });
    }
    await context.store.delete(WEBHOOK_KEY);
  },
  async run(context) {
    const stored = await context.store.get<StoredWebhook>(WEBHOOK_KEY);
    const body = helpScoutApi.verifiedWebhookBody({
      stored,
      headers: context.payload.headers,
      rawBody: context.payload.rawBody,
      body: context.payload.body,
    });
    return body ? [body] : [];
  },
  async test(context) {
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: '/customers',
      auth: context.auth,
      queryParams: { sortField: 'createdAt', sortOrder: 'desc' },
    });
    return helpScoutApi
      .getEmbeddedList({ body: response.body, key: 'customers' })
      .slice(0, 5);
  },
});

const WEBHOOK_KEY = 'helpscout_new_customer';
