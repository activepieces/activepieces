import { formitableRegisterTrigger } from './register-trigger';

export const optionCreated = formitableRegisterTrigger({
  name: 'option_created',
  displayName: 'Booking Option Created',
  description: 'Triggers when a booking option is created.',
  event: 'option.created',
  sampleData: {
    data: {
      option: {
        uid: 'opt123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'created',
      },
    },
    restaurantUid: 'rest123',
    event: 'option.created',
  },
});
