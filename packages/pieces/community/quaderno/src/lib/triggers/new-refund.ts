
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { quadernoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newRefund = createTrigger({
  auth: quadernoAuth,
  name: 'newRefund',
  displayName: 'New Refund',
  description: 'Triggers when a Quaderno credit note is created.',
  props: {},
  sampleData: {
    event_type: 'credit.created',
    account_id: 61,
    data: {
      object: {
        id: 92732431,
        created_at: 1593260908,
        number: '00001',
        issue_date: '2020-06-27',
        related_document: {
          id: 92732430,
          type: 'Invoice',
        },
        po_number: '999',
        due_date: '2020-07-27',
        currency: 'USD',
        tag_list: ['consulting', 'premium'],
        notes: 'Refund for returned items',
        contact: {
          id: 92732431,
          city: 'Pasadena',
          contact_person: null,
          country: 'US',
          created_at: 1648037653,
          department: null,
          discount: 0,
          email: 'leonard@gmail.com',
          first_name: 'Leonard',
          full_name: 'Leonard Hofstadter',
          kind: 'person',
          language: 'EN',
          last_name: 'Hofstadter',
          notes: 'Some private notes about the contact.',
          phone_1: '202-555-0104',
          postal_code: '91104',
          processor: 'stripe',
          processor_id: 'cus_999999999999',
          region: 'CA',
          street_line_1: '2311 North Los Robles Av.',
          street_line_2: 'Apartment C',
          tax_id: null,
          tax_status: 'taxable',
          web: 'https://theelevatorisbroken.com',
          url: 'https://quadernoapp.com/api/contacts/92732431',
        },
        country: 'US',
        postal_code: '91104',
        region: 'CA',
        street_line_1: '2311 North Los Robles Av.',
        street_line_2: 'Apartment C',
        tax_id: null,
        subject: null,
        items: [
          {
            id: 225369,
            product_code: null,
            description: 'Refunded Item',
            quantity: '1.0',
            unit_price: '99.99',
            discount_rate: '0.0',
            tax_1_amount_cents: 1600,
            tax_1_name: null,
            tax_1_rate: 20,
            tax_1_country: 'US',
            tax_2_amount_cents: 0,
          },
        ],
        total_cents: 9375,
        state: 'outstanding',
        permalink: 'https://quadernoapp.com/credit/123345abcdef67890',
        pdf: 'https://quadernoapp.com/credit/123345abcdef67890.pdf',
        url: 'https://quadernoapp.com/api/credit/92732431',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { account_name, api_key } = context.auth.props;
    const webhookUrl = context.webhookUrl;

    // Create webhook for credit.created event
    const response = await makeRequest(
      account_name,
      api_key,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events_types: ['credit.created'],
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