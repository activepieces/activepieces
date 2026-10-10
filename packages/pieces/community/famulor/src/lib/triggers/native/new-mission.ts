import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newMissionDefinition: PollDefinition = {
  "name": "newMission",
  "displayName": "New Mission",
  "description": "Triggers when a Milian mission first appears after enabling the flow.",
  "path": "/routines",
  "snapshot": true,
  "once": true,
  "unpaged": true
};
const newMission = createPollingTrigger(newMissionDefinition);

export { newMission, newMissionDefinition };
