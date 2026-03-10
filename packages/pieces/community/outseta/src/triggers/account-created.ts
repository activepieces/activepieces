import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountCreatedTrigger = createManualWebhookTrigger({
  name: 'account_created',
  displayName: 'Account Created',
  description: 'Triggers when a new account is created in Outseta.',
  sampleData: {
    Name: 'Example Company',
    IsDemo: false,
    AccountStage: 2,
    AccountStageLabel: 'Trialing',
    PersonAccount: [
      {
        Person: {
          Email: 'user@example.com',
          FirstName: 'Jane',
          LastName: 'Doe',
          FullName: 'Jane Doe',
          Uid: 'per_example',
          Created: '2024-01-01T00:00:00',
          Updated: '2024-01-01T00:00:00',
        },
        IsPrimary: true,
        Uid: 'pa_example',
        Created: '2024-01-01T00:00:00',
        Updated: '2024-01-01T00:00:00',
      },
    ],
    Subscriptions: [],
    Deals: [],
    Uid: 'acc_example',
    Created: '2024-01-01T00:00:00',
    Updated: '2024-01-01T00:00:00',
  },
});
