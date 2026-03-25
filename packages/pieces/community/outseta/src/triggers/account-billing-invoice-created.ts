import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountBillingInvoiceCreatedTrigger = createManualWebhookTrigger({
  name: 'account_billing_invoice_created',
  displayName: 'Account Billing Invoice Created',
  description: 'Triggers when a new billing invoice is created for an account in Outseta.',
  sampleData: {
    Number: 1001,
    BillingInvoiceDate: '2024-02-01T00:00:00',
    DueDate: '2024-02-15T00:00:00',
    Total: 49.00,
    Subtotal: 49.00,
    Tax: 0,
    AmountOutstanding: 49.00,
    Status: 0,
    BillingInvoiceLineItems: [
      {
        Description: 'Professional - Monthly',
        Amount: 49.00,
        Quantity: 1,
        Uid: 'ili_example1',
        _objectType: 'BillingInvoiceLineItem',
      },
    ],
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
    Updated: '2024-02-01T00:00:00',
  },
});
