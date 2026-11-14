import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newBookingDefinition: PollDefinition = {
  "name": "newBooking",
  "displayName": "New Booking",
  "description": "Triggers when a booking first appears after the flow is enabled. Reads all pages because bookings are sorted by appointment time.",
  "path": "/bookings",
  "snapshot": true,
  "once": true
};
const newBooking = createPollingTrigger(newBookingDefinition);

export { newBooking, newBookingDefinition };
