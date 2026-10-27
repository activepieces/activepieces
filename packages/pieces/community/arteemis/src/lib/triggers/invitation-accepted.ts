import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const invitationAccepted = arteemisEventTrigger({
  name: 'invitation_accepted',
  event: ARTEEMIS_EVENTS.INVITATION_ACCEPTED,
  displayName: 'LinkedIn Invitation Accepted',
  description: 'Triggers when someone accepts a LinkedIn invitation sent by one of your campaigns.',
  aiDescription:
    'Fires once per LinkedIn invitation from a campaign that the person accepts, with the sending LinkedIn account, the contact and the campaign.',
});
