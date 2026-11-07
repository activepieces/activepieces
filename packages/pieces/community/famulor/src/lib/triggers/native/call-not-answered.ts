import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const callNotAnsweredDefinition: PollDefinition = {
  "name": "callNotAnswered",
  "displayName": "Call Not Answered",
  "description": "Triggers once when a call reaches no-answer status after enabling the flow.",
  "path": "/calls",
  "timeField": "updated_at",
  "query": {
    "status": "no_answer",
    "sort": "updated_at"
  },
  "once": true
};
const callNotAnswered = createPollingTrigger(callNotAnsweredDefinition);

export { callNotAnswered, callNotAnsweredDefinition };
