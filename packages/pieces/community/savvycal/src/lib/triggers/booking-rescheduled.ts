import { createEventTrigger } from '../common/webhook-trigger-factory';

export const bookingRescheduledTrigger = createEventTrigger({
  name: 'booking_rescheduled',
  displayName: 'Booking Rescheduled',
  description: 'Triggers when a scheduled meeting is rescheduled to a new time.',
  eventType: 'event.rescheduled',
});
