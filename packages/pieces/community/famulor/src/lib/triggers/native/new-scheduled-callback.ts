import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newScheduledCallbackDefinition: PollDefinition = {
  "name": "newScheduledCallback",
  "displayName": "New Scheduled Callback",
  "description": "Triggers when a scheduled callback first appears after enabling the flow.",
  "path": "/scheduled-callbacks",
  "snapshot": true,
  "once": true
};
const newScheduledCallback = createPollingTrigger(newScheduledCallbackDefinition);

export { newScheduledCallback, newScheduledCallbackDefinition };
