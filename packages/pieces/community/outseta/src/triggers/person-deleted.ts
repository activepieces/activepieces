import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const personDeletedTrigger = createManualWebhookTrigger({
  name: 'person_deleted',
  displayName: 'Person Deleted',
  description: 'Triggers when a person is deleted in Outseta.',
  aiMetadata: {
    description:
      'Fires when a person (contact) is deleted in Outseta, delivering the deleted person record so downstream systems can clean up.',
  },
  sampleData: {
    Email: 'jane.doe@example.com',
    FirstName: 'Jane',
    LastName: 'Doe',
    FullName: 'Jane Doe',
    PhoneMobile: '+1234567890',
    PhoneWork: '',
    Title: '',
    HasLoggedIn: true,
    OAuthIntegrationStatus: 0,
    Uid: 'per_example1',
    _objectType: 'Person',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-06-01T10:00:00',
  },
});
