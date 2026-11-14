import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newAutomationDefinition: PollDefinition = {
  "name": "newAutomation",
  "displayName": "New Automation",
  "description": "Triggers when an automation first appears after enabling the flow.",
  "path": "/automations",
  "dataKey": "automations",
  "snapshot": true,
  "once": true,
  "unpaged": true
};
const newAutomation = createPollingTrigger(newAutomationDefinition);

export { newAutomation, newAutomationDefinition };
