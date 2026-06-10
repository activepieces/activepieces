import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountBillingInvoiceDeletedTrigger = createManualWebhookTrigger({
  name: 'account_billing_invoice_deleted',
  displayName: 'Account Billing Invoice Deleted',
  description: 'Triggers when a billing invoice is deleted for an account in Outseta.',
  sampleData: {
    Number: 1001,
    BillingInvoiceDate: '2024-02-01T00:00:00',
    DueDate: '2024-02-15T00:00:00',
    Total: 49.00,
    Subtotal: 49.00,
    Tax: 0,
    AmountOutstanding: 0,
    Status: 2,
    Account: {
      Name: 'Acme Corp',
      AccountStage: 3,
      AccountStageLabel: 'Subscribing',
      Uid: 'acc_example1',
      _objectType: 'Account',
    },
    Uid: 'inv_example1',
    _objectType: 'BillingInvoice',
    Created: '2024-02-01T00:00:00',
    Updated: '2024-03-01T00:00:00',
  },
});
