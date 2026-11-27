import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newOutboundCallDefinition: PollDefinition = {
  "name": "newOutboundCall",
  "displayName": "New Outbound Call",
  "description": "Triggers when an outbound call is created.",
  "path": "/calls",
  "timeField": "created_at",
  "query": {
    "direction": "outbound"
  }
};
const newOutboundCall = createPollingTrigger(newOutboundCallDefinition);

export { newOutboundCall, newOutboundCallDefinition };
