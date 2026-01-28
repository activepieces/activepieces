import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const personCreatedTrigger = createManualWebhookTrigger({
  name: 'person_created',
  displayName: 'Person created',
  description: 'Triggered when a person is created in Outseta',
  sampleData: {
    personUid: 'per_123',
    accountUid: 'acc_123',
    person: {
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    },
  },
});
