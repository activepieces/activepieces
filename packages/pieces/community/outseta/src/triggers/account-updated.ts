import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountUpdatedTrigger = createManualWebhookTrigger({
  name: 'account_updated',
  displayName: 'Account Updated',
  description: 'Triggers when an existing account is updated in Outseta.',
  sampleData: {
    Name: 'Example Company',
    IsDemo: false,
    AccountStage: 3,
    AccountStageLabel: 'Subscribing',
    PersonAccount: [
      {
        Person: {
          Email: 'user@example.com',
          FirstName: 'Jane',
          LastName: 'Doe',
          FullName: 'Jane Doe',
          Uid: 'per_example',
          Created: '2024-01-01T00:00:00',
          Updated: '2024-01-02T00:00:00',
        },
        IsPrimary: true,
        Uid: 'pa_example',
        Created: '2024-01-01T00:00:00',
        Updated: '2024-01-02T00:00:00',
      },
    ],
    Subscriptions: [],
    Deals: [],
    Uid: 'acc_example',
    Created: '2024-01-01T00:00:00',
    Updated: '2024-01-02T00:00:00',
  },
});
