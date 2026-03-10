import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const personUpdatedTrigger = createManualWebhookTrigger({
  name: 'person_updated',
  displayName: 'Person Updated',
  description: 'Triggers when an existing person (contact) is updated in Outseta.',
  sampleData: {
    Email: 'user@example.com',
    FirstName: 'Jane',
    LastName: 'Doe',
    FullName: 'Jane Doe',
    PhoneMobile: '+1234567890',
    PhoneWork: '',
    Title: 'CEO',
    OAuthIntegrationStatus: 0,
    Uid: 'per_example',
    Created: '2024-01-01T00:00:00',
    Updated: '2024-01-02T00:00:00',
  },
});
