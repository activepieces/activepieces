import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const subscriptionCreatedTrigger = createManualWebhookTrigger({
  name: 'subscription_created',
  displayName: 'Subscription Created',
  description: 'Triggers when a new subscription is created in Outseta.',
  sampleData: {
    BillingRenewalTerm: 1,
    Quantity: 1,
    StartDate: '2024-01-01T00:00:00',
    RenewalDate: '2024-02-01T00:00:00',
    NewRequiredQuantity: 0,
    IsPlanUpgradeRequired: false,
    IsPlanUpgradeRequiredStatus: 0,
    Account: {
      Name: 'Example Company',
      AccountStage: 3,
      AccountStageLabel: 'Subscribing',
      Uid: 'acc_example',
    },
    Uid: 'sub_example',
    Created: '2024-01-01T00:00:00',
    Updated: '2024-01-01T00:00:00',
  },
});
