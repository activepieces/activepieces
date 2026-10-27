import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const contactStatusChanged = arteemisEventTrigger({
  name: 'contact_status_changed',
  event: ARTEEMIS_EVENTS.CONTACT_STATUS_CHANGED,
  displayName: 'Contact Status Changed',
  description: 'Triggers when a contact changes status (new, in campaign, paused, replied, client, do not contact). For a reply, it also says what kind (interested, not interested...).',
  aiDescription:
    'Fires once per change of a contact\'s status (new, in_campaign, paused, replied, client, do_not_contact), with the contact and campaign; on a reply, reply_kind says what kind it was (interested, not_interested...).',
});
