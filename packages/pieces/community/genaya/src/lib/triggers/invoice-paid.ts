import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaWebhook } from '../common/webhook';

const EVENT = 'invoice.paid';

export const invoicePaid = createTrigger({
  auth: genayaAuth,
  name: 'invoice_paid',
  classification: 'READ',
  displayName: 'Invoice Paid',
  description: 'Triggers when an invoice is paid in full in Genaya.',
  aiMetadata: {
    description:
      'Fires when a Genaya invoice is paid in full. The payload is a summary of that invoice: number, totals, amount paid, paid date, client contact details and billing address. Use Payment Received to react to every individual payment instead.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event_id: 'evt_8vK4jYzq5Mn3',
    event_type: 'invoice.paid',
    event_created_at: '2026-08-05T18:04:05.000Z',
    organization_id: '9f2kX0aBcDeFgHiJ',
    object: 'invoice',
    id: '7sKq2dM3vPq1aBcDeFgH',
    number: 'VX3RM8',
    document_number: 1047,
    name: 'Water heater replacement',
    status: 'paid',
    currency: 'USD',
    subtotal: 440,
    discount_total: 0,
    discount_name: null,
    tax_rate: '10%',
    tax_name: 'Sales Tax',
    tax_total: 44,
    tip_total: 2.5,
    total: 486.5,
    amount_paid: 486.5,
    balance: 0,
    due_date: '2026-08-20',
    paid_at: '2026-08-05T18:04:00.000Z',
    last_payment_at: '2026-08-05T18:04:00.000Z',
    converted_from_estimate_id: null,
    converted_from_estimate_number: null,
    created_via: null,
    terms: 14,
    notes: 'Thanks for your business!',
    sent: true,
    sent_at: '2026-08-04T17:00:00.000Z',
    line_items_count: 2,
    line_items_summary: '1 x Water heater @ $380 = $380; 1 x Labor @ $60 = $60',
    signature_count: 0,
    client_name: 'Jordan Rivera',
    client_phone: '+14155550142',
    client_email: 'jordan@example.com',
    client_company: 'Maple Lane Studio',
    client_id: '7Qx2mF0aBcDeFgHiJkLm',
    client_number: 14,
    client_uuid: 'NP9FHZ',
    address: '6970 Lake View Rd',
    address_unit: null,
    address_city: 'Atlanta',
    address_state: 'GA',
    address_zip: '30303',
    address_country: 'US',
    appointment_id: '9Kd2pXq7Lm4',
    appointment_number: 'QRCJGW',
    billed_from_name: 'Downtown Branch',
    billed_from_email: 'billing@example.com',
    billed_from_phone: '+15436035172',
    billed_from_secondary_phone: null,
    billed_from_address: '500 Market St',
    billed_from_website: 'https://example.com',
    company_id: 'cmp_main',
    created_at: '2026-08-04T16:13:26.000Z',
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
