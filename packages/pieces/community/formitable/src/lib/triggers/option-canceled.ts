import { formitableRegisterTrigger } from './register-trigger';

export const optionCanceled = formitableRegisterTrigger({
  name: 'option_canceled',
  displayName: 'Booking Option Canceled',
  description: 'Triggers when a booking option is canceled.',
  event: 'option.canceled',
  sampleData: {
    data: {
      option: {
        uid: 'opt123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'canceled',
      },
    },
    restaurantUid: 'rest123',
    event: 'option.canceled',
  },
});
