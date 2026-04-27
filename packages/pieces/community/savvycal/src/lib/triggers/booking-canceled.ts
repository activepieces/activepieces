import { createEventTrigger } from '../common/webhook-trigger-factory';

export const bookingCanceledTrigger = createEventTrigger({
  name: 'booking_canceled',
  displayName: 'Booking Canceled',
  description: 'Triggers when a scheduled meeting is canceled.',
  eventType: 'event.canceled',
});
