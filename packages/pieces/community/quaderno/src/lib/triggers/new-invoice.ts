import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { quadernoAuth } from '../common/auth';

export const newInvoice = createTrigger({
  auth: quadernoAuth,
  name: 'newInvoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is created',
  props: {
    instruction: Property.MarkDown({
      value: `## Quaderno Webhook Setup
			To use this trigger, you need to manually set up a webhook in your Quaderno account:

			1. Login to your Quaderno account.
			2. On the left sidebar, navigate to **Settings** > **Webhooks**.
      3. Click on **Create Webhook**.
			4. Enter the following URL in the webhooks field and select **Invoice Created** as webhook trigger:
			\`\`\`text
			{{webhookUrl}}
			\`\`\`
			5. Click Save to register the webhook.
			`,
    }),
  },
  sampleData: {
    event_type: 'invoice.created',
    account_id: 61,
    data: {
      object: {
        evidence: 'confirmed',
        id: 154819,
        contact_id: 229899,
        tag_list: [],
        number: '00023',
        issue_date: '2023-06-09',
        contact_name: 'Alex Wick',
        currency: 'GBP',
        gross_amount_cents: 825,
        total_cents: 990,
        amount_paid_cents: 0,
        po_number: null,
        payment_details: null,
        notes: null,
        state: 'outstanding',
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
        pdf: 'https://YOUR_ACCOUNT_NAME.sandbox-quadernoapp.com/invoice/3a34cc5a9.pdf?otp=xxx',
        contact: {
          id: 1,
          created_at: 1726563618,
          email: 'buyer@example.com',
          first_name: 'Alex',
          kind: 'person',
          language: 'ES',
          last_name: 'Wick',
          notes: null,
          phone_1: null,
          processor: null,
          processor_id: null,
          tax_status: 'taxable',
          tax_id: 'xxx',
          web: null,
          department: '',
        },
        gross_amount: '8.25',
        total: '9.90',
        amount_paid: '0.00',
        exchange_rate: '1.161265',
        items: [
          {
            id: 225369,
            product_code: null,
            description: 'Simple Software',
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
        payments: [],
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    // Create webhook in Quaderno to listen for invoice.created events
  },

  async onDisable(context) {
    // Retrieve webhook ID from storage
  },
  async run(context) {
    return [context.payload.body];
  },
});
