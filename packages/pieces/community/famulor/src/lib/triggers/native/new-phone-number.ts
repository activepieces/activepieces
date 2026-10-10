import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newPhoneNumberDefinition: PollDefinition = {
  "name": "newPhoneNumber",
  "displayName": "New Phone Number",
  "description": "Triggers when a phone number is added to the workspace.",
  "path": "/phone-numbers",
  "timeField": "created_at"
};
const newPhoneNumber = createPollingTrigger(newPhoneNumberDefinition);

export { newPhoneNumber, newPhoneNumberDefinition };
