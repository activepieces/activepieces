import { formitableRegisterTrigger } from './register-trigger';

export const optionExpired = formitableRegisterTrigger({
  name: 'option_expired',
  displayName: 'Booking Option Expired',
  description: 'Triggers when a booking option expires.',
  event: 'option.expired',
  sampleData: {
    data: {
      option: {
        uid: 'opt123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'expired',
      },
    },
    restaurantUid: 'rest123',
    event: 'option.expired',
  },
});
