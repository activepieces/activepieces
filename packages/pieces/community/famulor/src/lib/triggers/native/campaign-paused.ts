import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const campaignPausedDefinition: PollDefinition = {
  "name": "campaignPaused",
  "displayName": "Campaign Paused",
  "description": "Triggers the first time a campaign appears paused after the flow is enabled. Existing paused campaigns are skipped.",
  "path": "/campaigns",
  "query": {
    "status": "paused"
  },
  "snapshot": true,
  "once": true
};
const campaignPaused = createPollingTrigger(campaignPausedDefinition);

export { campaignPaused, campaignPausedDefinition };
