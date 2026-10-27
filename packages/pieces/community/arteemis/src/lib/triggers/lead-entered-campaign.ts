import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const leadEnteredCampaign = arteemisEventTrigger({
  name: 'enrollment_started',
  event: ARTEEMIS_EVENTS.LEAD_ENTERED_CAMPAIGN,
  displayName: 'Lead Entered Campaign',
  description: 'Triggers when a lead enters a campaign.',
  aiDescription:
    'Fires once per lead enrolled in a campaign, with the contact, the campaign and the enrollment ID.',
});
