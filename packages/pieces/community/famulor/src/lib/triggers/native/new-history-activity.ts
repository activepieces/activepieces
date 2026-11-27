import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newHistoryActivityDefinition: PollDefinition = {
  "name": "newHistoryActivity",
  "displayName": "New Conversation Activity",
  "description": "Triggers for new activity in the unified conversation history. A conversation can emit again when its last activity changes.",
  "path": "/history",
  "timeField": "last_activity_at"
};
const newHistoryActivity = createPollingTrigger(newHistoryActivityDefinition);

export { newHistoryActivity, newHistoryActivityDefinition };
