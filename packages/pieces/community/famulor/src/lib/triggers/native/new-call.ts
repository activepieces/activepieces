import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newCallDefinition: PollDefinition = {
  "name": "newCall",
  "displayName": "New Call",
  "description": "Triggers when a new call is created in the workspace.",
  "path": "/calls",
  "timeField": "created_at"
};
const newCall = createPollingTrigger(newCallDefinition);

export { newCall, newCallDefinition };
