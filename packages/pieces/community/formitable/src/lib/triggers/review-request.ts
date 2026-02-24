import { formitableRegisterTrigger } from './register-trigger';

export const reviewRequest = formitableRegisterTrigger({
  name: 'review_request',
  displayName: 'Review Request',
  description: 'Triggers when a review request can be sent to the customer (typically 1 day after reservation).',
  event: 'review.request',
  sampleData: {
    data: {
      booking: {
        uid: 'abc123',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
      },
    },
    restaurantUid: 'rest123',
    event: 'review.request',
  },
});
