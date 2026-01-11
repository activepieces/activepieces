import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const subscriptionUpdatedTrigger = createManualWebhookTrigger({
  name: 'subscription_updated',
  displayName: 'Subscription updated',
  description: 'Triggered when a subscription is updated in Outseta',
  sampleData: {
    subscriptionUid: 'sub_123',
    accountUid: 'acc_123',
    subscription: {
      plan: 'Pro',
      status: 'PastDue',
    },
  },
});
