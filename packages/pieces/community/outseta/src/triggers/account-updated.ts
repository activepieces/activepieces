import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountUpdatedTrigger = createManualWebhookTrigger({
  name: 'account_updated',
  displayName: 'Account updated',
  description: 'Triggered when an account is updated in Outseta',
  sampleData: {
    accountUid: 'acc_123',
    account: { name: 'Example Company (updated)' },
  },
});
