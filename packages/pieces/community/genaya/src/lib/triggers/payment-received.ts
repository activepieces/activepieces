import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaWebhook } from '../common/webhook';

const EVENT = 'payment.received';

export const paymentReceived = createTrigger({
  auth: genayaAuth,
  name: 'payment_received',
  classification: 'READ',
  displayName: 'Payment Received',
  description: 'Triggers when a payment is collected or recorded in Genaya.',
  aiMetadata: {
    description:
      'Fires once for each payment collected or recorded in Genaya. The payload is a summary of that payment: amount, currency, method, fees, net amount, client contact details and the linked invoice. Use Invoice Paid to react only when an invoice is paid in full.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event_id: 'evt_5dG9wRzq2Hp7',
    event_type: 'payment.received',
    event_created_at: '2026-08-05T18:04:05.000Z',
    organization_id: '9f2kX0aBcDeFgHiJ',
    object: 'payment',
    id: 'pay_6Tq1Vb54Zx',
    amount: 486.5,
    currency: 'USD',
    method: 'Credit Card',
    provider: 'genaya_pay',
    status: 'succeeded',
    card_brand: 'visa',
    last4: '4242',
    paid_on: '2026-08-05',
    note: 'Paid in full at the door',
    fee: 14.4,
    service_fee: 0,
    net: 472.1,
    email_receipt: true,
    client_name: 'Jordan Rivera',
    client_phone: '+14155550142',
    client_email: 'jordan@example.com',
    client_id: '7Qx2mF0aBcDeFgHiJkLm',
    invoice_id: '7sKq2dM3vPq1aBcDeFgH',
    invoice_number: 'VX3RM8',
    invoice_total: 486.5,
    appointment_id: '9Kd2pXq7Lm4',
    company_id: 'cmp_9aF2',
    company_name: 'Avery HVAC - North',
    created_at: '2026-08-05T18:04:00.000Z',
    refunded_amount: null,
    fully_refunded: null,
    failure_code: null,
    failure_message: null,
  },
  async onEnable(context) {
    await genayaWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      event: EVENT,
      store: context.store,
    });
  },
  async onDisable(context) {
    await genayaWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store });
  },
  async run(context) {
    return genayaWebhook.handle({ payload: context.payload, store: context.store, event: EVENT });
  },
});
