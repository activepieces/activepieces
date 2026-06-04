import { createTeamWebhookTrigger } from '../common/trigger-factory';

export const updatedContactTrigger = createTeamWebhookTrigger({
  name: 'updated_contact',
  displayName: 'Updated Contact',
  description: 'Triggers when a contact in the selected team is updated.',
  event: 'CONTACT_UPDATE',
  sampleData: {
    key: 'agxzfm1haWxmb29nYWVyMQsSB0NvbnRhY3QYgICAwI_oogow',
    emailAddresses: ['jane@acme.com'],
    givenName: 'Jane',
    familyName: 'Doe',
    title: 'VP of Sales',
    lastSavedTimestamp: 1714080000000,
  },
});
