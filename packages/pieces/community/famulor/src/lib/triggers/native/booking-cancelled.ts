import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const bookingCancelledDefinition: PollDefinition = {
  "name": "bookingCancelled",
  "displayName": "Booking Cancelled",
  "description": "Triggers the first time a booking appears cancelled after enabling the flow. Existing cancellations are skipped.",
  "path": "/bookings",
  "query": {
    "status": "cancelled"
  },
  "snapshot": true,
  "once": true
};
const bookingCancelled = createPollingTrigger(bookingCancelledDefinition);

export { bookingCancelled, bookingCancelledDefinition };
