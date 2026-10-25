import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const getAssistantsDefinition: PollDefinition = {
  "name": "getAssistants",
  "displayName": "New Assistant",
  "description": "Triggers when an assistant is created in the workspace.",
  "path": "/assistants",
  "timeField": "created_at"
};
const getAssistants = createPollingTrigger(getAssistantsDefinition);

export { getAssistants, getAssistantsDefinition };
