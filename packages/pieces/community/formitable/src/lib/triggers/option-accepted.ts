import { formitableRegisterTrigger } from './register-trigger';

export const optionAccepted = formitableRegisterTrigger({
  name: 'option_accepted',
  displayName: 'Booking Option Accepted',
  description: 'Triggers when a booking option is accepted. A booking.accepted event will also be fired.',
  event: 'option.accepted',
  sampleData: {
    data: {
      option: {
        uid: 'opt123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'accepted',
      },
    },
    restaurantUid: 'rest123',
    event: 'option.accepted',
  },
});
