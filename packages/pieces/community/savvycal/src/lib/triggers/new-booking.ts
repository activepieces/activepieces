import { createEventTrigger } from '../common/webhook-trigger-factory';

export const newBookingTrigger = createEventTrigger({
  name: 'new_booking',
  displayName: 'New Booking',
  description: 'Triggers when a new meeting is booked on any scheduling link.',
  eventType: 'event.created',
});
