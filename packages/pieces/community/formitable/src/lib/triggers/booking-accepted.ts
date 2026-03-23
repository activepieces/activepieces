import { formitableRegisterTrigger } from './register-trigger';

export const bookingAccepted = formitableRegisterTrigger({
  name: 'booking_accepted',
  displayName: 'Booking Accepted',
  description: 'Triggers when a booking is accepted.',
  event: 'booking.accepted',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'accepted',
      },
    },
    restaurantUid: 'rest123',
    event: 'booking.accepted',
  },
});
