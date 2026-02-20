import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const personUpdatedTrigger = createManualWebhookTrigger({
  name: 'person_updated',
  displayName: 'Person updated',
  description: 'Triggered when a person is updated in Outseta',
  sampleData: {
    personUid: 'per_123',
    accountUid: 'acc_123',
    person: {
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe (updated)',
    },
  },
});
