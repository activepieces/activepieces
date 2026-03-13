import { formitableRegisterTrigger } from './register-trigger';

export const bookingCheckout = formitableRegisterTrigger({
  name: 'booking_checkout',
  displayName: 'Guest Checked Out',
  description: 'Triggers when a guest checks out from the restaurant.',
  event: 'booking.checkout',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'checkout',
      },
    },
    restaurantUid: 'rest123',
    event: 'booking.checkout',
  },
});
