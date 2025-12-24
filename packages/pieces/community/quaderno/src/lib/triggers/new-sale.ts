
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { quadernoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newSale = createTrigger({
  auth: quadernoAuth,
  name: 'newSale',
  displayName: 'New Sale',
  description: 'Triggers when a new sale (Receipt) is created.',
  props: {},
  sampleData: {
    event_type: 'receipt.created',
    account_id: 61,
    data: {
      object: {
        id: 154819,
        contact_id: 229899,
        tag_list: [],
        number: '00045',
        issue_date: '2023-06-09',
        contact_name: 'Alex Wick',
        currency: 'GBP',
        gross_amount_cents: 825,
        total_cents: 990,
        amount_paid_cents: 990,
        po_number: null,
        payment_details: null,
        notes: null,
        state: 'paid',
        subject: null,
        street_line_1: '67 Church Lane',
        street_line_2: null,
        city: 'London',
        postal_code: 'E94 7RT',
        region: null,
        country: 'GB',
        tax_id: null,
        processor_id: null,
        processor: null,
        processor_fee_cents: null,
        custom_metadata: {},
        due_date: null,
        permalink: '3a34cc5a9',
        pdf: 'https://YOUR_ACCOUNT_NAME.sandbox-quadernoapp.com/receipt/3a34cc5a9.pdf?otp=xxx',
        contact: {
          id: 1,
          created_at: 1726563618,
          email: 'buyer@example.com',
          first_name: 'Alex',
          kind: 'person',
          language: 'EN',
          last_name: 'Wick',
          notes: null,
          phone_1: null,
          processor: null,
          processor_id: null,
          tax_status: 'taxable',
          tax_id: null,
          web: null,
          department: '',
        },
        gross_amount: '8.25',
        total: '9.90',
        amount_paid: '9.90',
        exchange_rate: '1.161265',
        items: [
          {
            id: 225369,
            product_code: null,
            description: 'Product Sale',
            quantity: '1.0',
            unit_price: '8.25',
            discount_rate: '0.0',
            tax_1_amount_cents: 165,
            tax_1_name: null,
            tax_1_rate: 20,
            tax_1_country: 'GB',
            tax_2_amount_cents: 0,
            tax_2_name: null,
            tax_2_rate: null,
            tax_2_country: 'GB',
            subtotal_cents: 825.0,
            total_amount_cents: 990,
            discount_cents: 0.0,
            taxes_included: true,
            reference: null,
            tax_1_amount: '1.65',
            tax_2_amount: '0.00',
            unit_price_cents: '825.00',
            discount: '0.00',
            subtotal: '8.25',
            total_amount: '9.90',
          },
        ],
        payments: [
          {
            id: 110847,
            document_id: 154819,
            date: '2023-06-09',
            payment_method: 'credit_card',
            amount_cents: 990,
            processor: 'stripe',
            processor_id: '12345',
            amount: '9.90',
          },
        ],
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { account_name, api_key } = context.auth.props;
    const webhookUrl = context.webhookUrl;

    // Create webhook for receipt.created event
    const response = await makeRequest(
      account_name,
      api_key,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events_types: ['receipt.created'],
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