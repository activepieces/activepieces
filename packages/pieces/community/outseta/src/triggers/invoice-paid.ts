import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const invoicePaidTrigger = createManualWebhookTrigger({
  name: 'invoice_paid',
  displayName: 'Invoice paid',
  description: 'Triggered when an invoice is paid in Outseta',
  sampleData: {
    invoiceUid: 'inv_123',
    accountUid: 'acc_123',
    invoice: {
      total: 4900,
      currency: 'EUR',
      status: 'Paid',
    },
  },
});
