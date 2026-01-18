import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountCreatedTrigger = createManualWebhookTrigger({
  name: 'account_created',
  displayName: 'Account created',
  description: 'Triggered when an account is created in Outseta',
  sampleData: {
    accountUid: 'acc_123',
    account: { name: 'Example Company' },
  },
});
