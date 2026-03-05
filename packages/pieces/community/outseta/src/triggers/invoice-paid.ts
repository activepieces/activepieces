import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const invoicePaidTrigger = createManualWebhookTrigger({
  name: 'invoice_paid',
  displayName: 'Invoice Paid',
  description: 'Triggers when an invoice is paid in Outseta.',
  sampleData: {
    Number: 1001,
    BillingInvoiceDate: '2024-01-01T00:00:00',
    DueDate: '2024-01-01T00:00:00',
    Total: 4900,
    Subtotal: 4900,
    Tax: 0,
    AmountOutstanding: 0,
    Status: 1,
    Account: {
      Name: 'Example Company',
      AccountStage: 3,
      AccountStageLabel: 'Subscribing',
      Uid: 'acc_example',
    },
    Uid: 'inv_example',
    Created: '2024-01-01T00:00:00',
    Updated: '2024-01-01T00:00:00',
  },
});
