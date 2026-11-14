import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const inboundCallDefinition: PollDefinition = {
  "name": "inboundCall",
  "displayName": "New Inbound Call",
  "description": "Triggers when a new inbound call is created. This event does not provide synchronous caller-variable enrichment.",
  "path": "/calls",
  "timeField": "created_at",
  "query": {
    "direction": "inbound"
  }
};
const inboundCall = createPollingTrigger(inboundCallDefinition);

export { inboundCall, inboundCallDefinition };
