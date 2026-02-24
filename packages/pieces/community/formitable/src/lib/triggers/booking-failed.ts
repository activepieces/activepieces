import { formitableRegisterTrigger } from './register-trigger';

export const bookingFailed = formitableRegisterTrigger({
  name: 'booking_failed',
  displayName: 'Booking Failed',
  description: 'Triggers when a booking fails.',
  event: 'booking.failed',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'failed',
      },
    },
    restaurantUid: 'rest123',
    event: 'booking.failed',
  },
});
