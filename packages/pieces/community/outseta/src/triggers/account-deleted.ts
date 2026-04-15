import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountDeletedTrigger = createManualWebhookTrigger({
  name: 'account_deleted',
  displayName: 'Account Deleted',
  description: 'Triggers when an account is deleted in Outseta.',
  sampleData: {
    Name: 'Acme Corp',
    IsDemo: false,
    AccountStage: 5,
    AccountStageLabel: 'Expired',
    PersonAccount: [
      {
        Person: {
          Email: 'jane.doe@example.com',
          FirstName: 'Jane',
          LastName: 'Doe',
          FullName: 'Jane Doe',
          Uid: 'per_example1',
          _objectType: 'Person',
        },
        IsPrimary: true,
        Uid: 'pa_example1',
        _objectType: 'PersonAccount',
      },
    ],
    Subscriptions: [],
    CurrentSubscription: null,
    Deals: [],
    HasLoggedIn: true,
    LifetimeRevenue: 0,
    Uid: 'acc_example1',
    _objectType: 'Account',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-06-01T10:00:00',
  },
});
