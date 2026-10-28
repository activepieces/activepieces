import { callsyncWebhookTrigger } from '../common/webhook-trigger';
import { contactUpdatedSample } from '../common/samples';

export const contactUpdated = callsyncWebhookTrigger({
  name: 'contact_updated',
  displayName: 'Contact Updated',
  description: 'Triggers when a contact\'s name, note or labels change in CallSync.',
  aiDescription:
    'Fires when a caller\'s name, note or labels are edited in CallSync, with the contact\'s current details.',
  event: 'caller_updated',
  sampleData: contactUpdatedSample,
});
