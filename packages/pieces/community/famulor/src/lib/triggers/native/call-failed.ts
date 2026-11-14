import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const callFailedDefinition: PollDefinition = {
  "name": "callFailed",
  "displayName": "Call Failed",
  "description": "Triggers once when a call is found in failed status after enabling the flow.",
  "path": "/calls",
  "timeField": "updated_at",
  "query": {
    "status": "failed",
    "sort": "updated_at"
  },
  "once": true
};
const callFailed = createPollingTrigger(callFailedDefinition);

export { callFailed, callFailedDefinition };
