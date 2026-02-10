import { formitableRegisterTrigger } from './register-trigger';

export const bookingCheckin = formitableRegisterTrigger({
  name: 'booking_checkin',
  displayName: 'Guest Checked In',
  description: 'Triggers when a guest checks in at the restaurant.',
  event: 'booking.checkin',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'checkin',
      },
    },
    restaurantUid: 'rest123',
    event: 'booking.checkin',
  },
});
