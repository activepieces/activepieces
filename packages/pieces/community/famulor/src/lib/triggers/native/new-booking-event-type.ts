import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newBookingEventTypeDefinition: PollDefinition = {
  "name": "newBookingEventType",
  "displayName": "New Booking Event Type",
  "description": "Triggers when a booking event type first appears after enabling the flow.",
  "path": "/booking-event-types",
  "snapshot": true,
  "once": true,
  "unpaged": true
};
const newBookingEventType = createPollingTrigger(newBookingEventTypeDefinition);

export { newBookingEventType, newBookingEventTypeDefinition };
