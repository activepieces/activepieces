import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newContactDefinition: PollDefinition = {
  "name": "newContact",
  "displayName": "New Contact",
  "description": "Triggers when a new Audience contact is created in the workspace.",
  "path": "/leads",
  "timeField": "created_at"
};
const newContact = createPollingTrigger(newContactDefinition);

export { newContact, newContactDefinition };
