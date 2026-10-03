import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const phoneCallEndedDefinition: PollDefinition = {
  "name": "phoneCallEnded",
  "displayName": "Phone Call Completed",
  "description": "Triggers once when a call completes after the flow is enabled. Polls updated calls so calls created earlier can still finish later.",
  "path": "/calls",
  "timeField": "updated_at",
  "query": {
    "status": "completed",
    "sort": "updated_at"
  },
  "completed": true,
  "once": true
};
const phoneCallEnded = createPollingTrigger(phoneCallEndedDefinition);

export { phoneCallEnded, phoneCallEndedDefinition };
