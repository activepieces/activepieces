import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const campaignLeadCompletedDefinition: PollDefinition = {
  "name": "campaignLeadCompleted",
  "displayName": "Campaign Lead Completed",
  "description": "Triggers the first time a lead appears completed in the selected campaign after enabling the flow.",
  "path": "/campaigns",
  "query": {
    "status": "completed"
  },
  "campaign": true,
  "once": true
};
const campaignLeadCompleted = createPollingTrigger(campaignLeadCompletedDefinition);

export { campaignLeadCompleted, campaignLeadCompletedDefinition };
