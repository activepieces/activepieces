import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const personCreatedTrigger = createManualWebhookTrigger({
  name: 'person_created',
  displayName: 'Person Created',
  description: 'Triggers when a new person (contact) is created in Outseta.',
  sampleData: {
    Email: 'user@example.com',
    FirstName: 'Jane',
    LastName: 'Doe',
    FullName: 'Jane Doe',
    PhoneMobile: '',
    PhoneWork: '',
    Title: '',
    OAuthIntegrationStatus: 0,
    Uid: 'per_example',
    Created: '2024-01-01T00:00:00',
    Updated: '2024-01-01T00:00:00',
  },
});
