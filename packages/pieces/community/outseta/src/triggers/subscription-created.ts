import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const subscriptionCreatedTrigger = createManualWebhookTrigger({
  name: 'subscription_created',
  displayName: 'Subscription created',
  description: 'Triggered when a subscription is created in Outseta',
  sampleData: {
    subscriptionUid: 'sub_123',
    accountUid: 'acc_123',
    subscription: {
      plan: 'Pro',
      status: 'Active',
    },
  },
});
