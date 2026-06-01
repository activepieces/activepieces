import { createTeamWebhookTrigger } from '../common/trigger-factory';

export const newContactTrigger = createTeamWebhookTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created in the selected team.',
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
