import { createTeamWebhookTrigger } from '../common/trigger-factory';

export const newContactTrigger = createTeamWebhookTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created in the selected team.',
  aiMetadata: {
    description:
      'Fires when a new person contact is created in the selected team, representing a freshly added individual in the team\'s shared CRM.',
  },
  event: 'CONTACT_CREATE',
  sampleData: {
    key: 'agxzfm1haWxmb29nYWVyMQsSB0NvbnRhY3QYgICAwI_oogow',
    emailAddresses: ['jane@acme.com'],
    givenName: 'Jane',
    familyName: 'Doe',
    title: 'VP of Sales',
    creationDate: 1714080000000,
  },
});
