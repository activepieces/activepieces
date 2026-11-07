import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newSuppressionEntryDefinition: PollDefinition = {
  "name": "newSuppressionEntry",
  "displayName": "New Suppression Entry",
  "description": "Triggers when a suppression entry first appears after enabling the flow.",
  "path": "/suppression-list",
  "snapshot": true,
  "once": true
};
const newSuppressionEntry = createPollingTrigger(newSuppressionEntryDefinition);

export { newSuppressionEntry, newSuppressionEntryDefinition };
