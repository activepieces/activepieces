import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newWebCallDefinition: PollDefinition = {
  "name": "newWebCall",
  "displayName": "New Web Call",
  "description": "Triggers when a browser call is created.",
  "path": "/calls",
  "timeField": "created_at",
  "query": {
    "direction": "web"
  }
};
const newWebCall = createPollingTrigger(newWebCallDefinition);

export { newWebCall, newWebCallDefinition };
