import { formitableRegisterTrigger } from './register-trigger';

export const reviewCreated = formitableRegisterTrigger({
  name: 'review_created',
  displayName: 'Review Created',
  description: 'Triggers when a review is created.',
  event: 'review.created',
  sampleData: {
    data: {
      review: {
        uid: 'rev123',
        rating: 5,
        comment: 'Excellent dining experience!',
        createdAt: '2024-01-16T12:00:00Z',
      },
    },
    restaurantUid: 'rest123',
    event: 'review.created',
  },
});
