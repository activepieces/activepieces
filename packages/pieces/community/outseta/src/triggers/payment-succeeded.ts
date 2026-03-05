import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const paymentSucceededTrigger = createManualWebhookTrigger({
  name: 'payment_succeeded',
  displayName: 'Payment Succeeded',
  description: 'Triggers when a payment is successfully processed in Outseta.',
  sampleData: {
    Amount: 4900,
    PaymentDate: '2024-01-01T00:00:00',
    TransactionId: 'txn_example',
    Status: 1,
    Account: {
      Name: 'Example Company',
      AccountStage: 3,
      AccountStageLabel: 'Subscribing',
      Uid: 'acc_example',
    },
    Uid: 'pay_example',
    Created: '2024-01-01T00:00:00',
    Updated: '2024-01-01T00:00:00',
  },
});
