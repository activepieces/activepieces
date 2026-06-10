import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const personUpdatedTrigger = createManualWebhookTrigger({
  name: 'person_updated',
  displayName: 'Person Updated',
  description: 'Triggers when an existing person is updated in Outseta.',
  sampleData: {
    Email: 'jane.doe@example.com',
    FirstName: 'Jane',
    LastName: 'Doe',
    FullName: 'Jane Doe',
    PhoneMobile: '+1234567890',
    PhoneWork: '+1987654321',
    Title: 'CEO',
    Timezone: 'America/New_York',
    Language: 'en',
    LastLoginDateTime: '2024-02-01T10:00:00',
    HasLoggedIn: true,
    OAuthIntegrationStatus: 0,
    OptInToEmailList: true,
    HasUnsubscribed: false,
    Account: {
      Name: 'Acme Corp',
      AccountStage: 3,
      AccountStageLabel: 'Subscribing',
      Uid: 'acc_example1',
      _objectType: 'Account',
    },
    Uid: 'per_example1',
    _objectType: 'Person',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-02-01T10:00:00',
  },
});
