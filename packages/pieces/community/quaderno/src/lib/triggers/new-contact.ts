
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { quadernoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newContact = createTrigger({
  auth: quadernoAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  props: {},
  sampleData: {
    event_type: 'contact.created',
    account_id: 61,
    data: {
      object: {
        id: 228249,
        kind: 'person',
        first_name: 'John',
        last_name: 'Wick',
        full_name: 'John Wick',
        contact_name: null,
        street_line_1: '67 Church Lane',
        street_line_2: null,
        postal_code: 'E94 7RT',
        city: 'London',
        region: null,
        country: 'GB',
        phone_1: null,
        email: 'john@example.com',
        web: null,
        discount: null,
        language: 'EN',
        tax_id: null,
        bank_account: null,
        notes: null,
        bic: null,
        vat_number: null,
        currency: 'GBP',
        processor_id: null,
        processor: null,
        created_at: 1726563618,
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { account_name, api_key } = context.auth.props;
    const webhookUrl = context.webhookUrl;

    // Create webhook for contact.created event
    const response = await makeRequest(
      account_name,
      api_key,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events_types: ['contact.created'],
      }
    );

    // Store webhook ID for later deletion
    await context.store.put('webhookId', response.id.toString());
  },
  async onDisable(context) {
    const { account_name, api_key } = context.auth.props;
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      // Delete webhook
      await makeRequest(
        account_name,
        api_key,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});