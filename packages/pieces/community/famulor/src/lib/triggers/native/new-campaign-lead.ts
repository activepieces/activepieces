import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newCampaignLeadDefinition: PollDefinition = {
  "name": "newCampaignLead",
  "displayName": "New Campaign Lead",
  "description": "Triggers the first time a lead is added to the selected campaign after enabling the flow, including existing contacts.",
  "path": "/campaigns",
  "campaign": true,
  "once": true
};
const newCampaignLead = createPollingTrigger(newCampaignLeadDefinition);

export { newCampaignLead, newCampaignLeadDefinition };
