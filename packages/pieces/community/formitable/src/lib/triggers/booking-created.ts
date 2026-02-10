import { formitableRegisterTrigger } from './register-trigger';

export const bookingCreated = formitableRegisterTrigger({
  name: 'booking_created',
  displayName: 'Booking Created',
  description: 'Triggers when a new booking is created.',
  event: 'booking.created',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'created',
      },
    },
    restaurantUid: 'rest123',
    event: 'booking.created',
  },
});
