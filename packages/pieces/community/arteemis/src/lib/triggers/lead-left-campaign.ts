import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const leadLeftCampaign = arteemisEventTrigger({
  name: 'enrollment_ended',
  event: ARTEEMIS_EVENTS.LEAD_LEFT_CAMPAIGN,
  displayName: 'Lead Left Campaign',
  description: 'Triggers when a lead\'s sequence ends, with the reason: finished, replied, wrong person, unsubscribed, bounced, no channel, removed by hand or the organization replied.',
  aiDescription:
    'Fires once per campaign sequence that ends for a lead, with the reason (sequence_done, replied, wrong_person, unsubscribed, bounced, no_channel, manual or organization_replied), the contact and the campaign.',
});
