import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const bookingCompletedDefinition: PollDefinition = {
  "name": "bookingCompleted",
  "displayName": "Booking Completed",
  "description": "Triggers the first time a booking appears completed after enabling the flow.",
  "path": "/bookings",
  "query": {
    "status": "completed"
  },
  "snapshot": true,
  "once": true
};
const bookingCompleted = createPollingTrigger(bookingCompletedDefinition);

export { bookingCompleted, bookingCompletedDefinition };
