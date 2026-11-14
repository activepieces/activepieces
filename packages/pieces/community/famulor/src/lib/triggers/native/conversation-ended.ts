import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const conversationEndedDefinition: PollDefinition = {
  "name": "conversationEnded",
  "displayName": "Conversation Completed",
  "description": "Triggers once when a messaging or email conversation first appears completed after enabling the flow. Existing completed conversations are skipped.",
  "path": "/history",
  "timeField": "last_activity_at",
  "query": {
    "status": "completed"
  },
  "snapshot": true,
  "messaging": true,
  "once": true
};
const conversationEnded = createPollingTrigger(conversationEndedDefinition);

export { conversationEnded, conversationEndedDefinition };
