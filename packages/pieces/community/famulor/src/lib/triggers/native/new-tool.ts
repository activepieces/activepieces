import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newToolDefinition: PollDefinition = {
  "name": "newTool",
  "displayName": "New Tool",
  "description": "Triggers when a reusable tool first appears after enabling the flow.",
  "path": "/tools",
  "snapshot": true,
  "once": true,
  "unpaged": true
};
const newTool = createPollingTrigger(newToolDefinition);

export { newTool, newToolDefinition };
