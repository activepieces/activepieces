import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const campaignStartedDefinition: PollDefinition = {
  "name": "campaignStarted",
  "displayName": "Campaign Started",
  "description": "Triggers the first time a campaign appears running after the flow is enabled. Existing running campaigns are skipped.",
  "path": "/campaigns",
  "query": {
    "status": "running"
  },
  "snapshot": true,
  "once": true
};
const campaignStarted = createPollingTrigger(campaignStartedDefinition);

export { campaignStarted, campaignStartedDefinition };
