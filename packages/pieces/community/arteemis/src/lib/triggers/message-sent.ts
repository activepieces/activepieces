import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const messageSent = arteemisEventTrigger({
  name: 'message_sent',
  event: ARTEEMIS_EVENTS.MESSAGE_SENT,
  displayName: 'Message Sent',
  description: 'Triggers when an email, a LinkedIn message or a LinkedIn invitation leaves for a contact.',
  aiDescription:
    'Fires once per email, LinkedIn message or LinkedIn invitation sent to a contact, from a campaign step or by hand, with its channel, kind, step and subject (never the body), the contact and the campaign.',
});
