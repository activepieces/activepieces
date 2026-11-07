import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const campaignCompletedDefinition: PollDefinition = {
  "name": "campaignCompleted",
  "displayName": "Campaign Completed",
  "description": "Triggers the first time a campaign appears completed after the flow is enabled. Existing completed campaigns are skipped.",
  "path": "/campaigns",
  "query": {
    "status": "completed"
  },
  "snapshot": true,
  "once": true
};
const campaignCompleted = createPollingTrigger(campaignCompletedDefinition);

export { campaignCompleted, campaignCompletedDefinition };
