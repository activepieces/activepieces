import { formitableRegisterTrigger } from './register-trigger';

export const bookingCanceled = formitableRegisterTrigger({
  name: 'booking_canceled',
  displayName: 'Booking Canceled',
  description: 'Triggers when a booking is canceled.',
  event: 'booking.canceled',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'canceled',
      },
    },
    restaurantUid: 'rest123',
    event: 'booking.canceled',
  },
});
