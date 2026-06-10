import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const personAddedTrigger = createManualWebhookTrigger({
  name: 'person_added',
  displayName: 'Person Added',
  description: 'Triggers when a new person is added in Outseta.',
  sampleData: {
    Email: 'jane.doe@example.com',
    FirstName: 'Jane',
    LastName: 'Doe',
    FullName: 'Jane Doe',
    PhoneMobile: '+1234567890',
    PhoneWork: '',
    Title: '',
    Timezone: 'America/New_York',
    Language: 'en',
    IPAddress: '',
    HasLoggedIn: false,
    OAuthIntegrationStatus: 0,
    OptInToEmailList: false,
    HasUnsubscribed: false,
    Account: {
      Name: 'Acme Corp',
      AccountStage: 2,
      AccountStageLabel: 'Trialing',
      Uid: 'acc_example1',
      _objectType: 'Account',
    },
    Uid: 'per_example1',
    _objectType: 'Person',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-01-15T10:00:00',
  },
});
