import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newSegmentDefinition: PollDefinition = {
  "name": "newSegment",
  "displayName": "New Segment",
  "description": "Triggers when an Audience segment is created.",
  "path": "/segments",
  "timeField": "created_at"
};
const newSegment = createPollingTrigger(newSegmentDefinition);

export { newSegment, newSegmentDefinition };
