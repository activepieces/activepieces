import {
  createTrigger,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import { simplybookAuth, SimplybookAuth, subscribeWebhook } from '../common';

export const newInvoice = createTrigger({
  auth: simplybookAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is generated/paid in SimplyBook.me (requires Accept Payments feature)',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const auth = context.auth as SimplybookAuth;
    await subscribeWebhook(auth, context.webhookUrl, 'create_invoice');
    await context.store.put('webhook_registered', true);
  },
  async onDisable(context) {
    await context.store.delete('webhook_registered');
  },
  async run(context) {
    const body = context.payload.body as any;
    return [body];
  },
  sampleData: {
    id: 98765,
    booking_id: 123456,
    client_id: 12345,
    amount: 100.00,
    currency: 'USD',
    status: 'paid',
    payment_method: 'credit_card',
    created_at: '2025-10-05T14:30:00.000Z',
    paid_at: '2025-10-05T14:35:00.000Z',
    invoice_number: 'INV-2025-001',
    items: [
      {
        description: 'Consultation Service',
        quantity: 1,
        unit_price: 100.00,
        total: 100.00
      }
    ]
  }
});
