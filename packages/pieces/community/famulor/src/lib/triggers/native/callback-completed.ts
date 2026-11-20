import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const callbackCompletedDefinition: PollDefinition = {
  "name": "callbackCompleted",
  "displayName": "Callback Completed",
  "description": "Triggers the first time a scheduled callback appears completed after enabling the flow.",
  "path": "/scheduled-callbacks",
  "query": {
    "status": "completed"
  },
  "snapshot": true,
  "once": true
};
const callbackCompleted = createPollingTrigger(callbackCompletedDefinition);

export { callbackCompleted, callbackCompletedDefinition };
