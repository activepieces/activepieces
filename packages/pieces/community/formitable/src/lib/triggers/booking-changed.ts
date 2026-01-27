import { formitableRegisterTrigger } from './register-trigger';

export const bookingChanged = formitableRegisterTrigger({
  name: 'booking_changed',
  displayName: 'Booking Changed',
  description: 'Triggers when a booking is updated.',
  event: 'booking.changed',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '20:00',
        partySize: 6,
        status: 'changed',
      },
    },
    restaurantUid: 'rest123',
    event: 'booking.changed',
  },
});
