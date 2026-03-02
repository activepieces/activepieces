import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const paymentSucceededTrigger = createManualWebhookTrigger({
  name: 'payment_succeeded',
  displayName: 'Payment succeeded',
  description: 'Triggered when a payment succeeds in Outseta',
  sampleData: {
    paymentUid: 'pay_123',
    accountUid: 'acc_123',
    payment: {
      amount: 4900,
      currency: 'EUR',
      status: 'Succeeded',
    },
  },
});
