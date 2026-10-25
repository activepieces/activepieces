import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newCampaignDefinition: PollDefinition = {
  "name": "newCampaign",
  "displayName": "New Campaign",
  "description": "Triggers when a campaign is created in the workspace.",
  "path": "/campaigns",
  "timeField": "created_at"
};
const newCampaign = createPollingTrigger(newCampaignDefinition);

export { newCampaign, newCampaignDefinition };
