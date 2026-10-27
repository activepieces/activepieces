import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const newReply = arteemisEventTrigger({
  name: 'new_reply',
  event: ARTEEMIS_EVENTS.NEW_REPLY,
  displayName: 'New Reply',
  description: 'Triggers when a contact replies to you by email or on LinkedIn.',
  aiDescription:
    'Fires once per reply a contact sends, by email or on LinkedIn, with the message\'s channel and time (never its body), the contact and their latest campaign. Use Contact Status Changed instead to react to the kind of reply (interested, not interested).',
});
