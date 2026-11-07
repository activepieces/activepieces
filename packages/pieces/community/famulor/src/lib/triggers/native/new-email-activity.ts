import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newEmailActivityDefinition: PollDefinition = {
  "name": "newEmailActivity",
  "displayName": "New Email Activity",
  "description": "Triggers when an email thread has new activity in the unified conversation history.",
  "path": "/history",
  "timeField": "last_activity_at",
  "query": {
    "type": "email"
  }
};
const newEmailActivity = createPollingTrigger(newEmailActivityDefinition);

export { newEmailActivity, newEmailActivityDefinition };
