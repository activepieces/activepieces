import { formitableRegisterTrigger } from './register-trigger';

export const messageReceived = formitableRegisterTrigger({
  name: 'message_received',
  displayName: 'Message Sent to Customer',
  description: 'Triggers when a message is sent by the restaurant to the customer.',
  event: 'message.received',
  sampleData: {
    data: {
      message: {
        uid: 'msg123',
        content: 'Thank you for your inquiry. Your reservation is confirmed.',
        sentAt: '2024-01-15T10:35:00Z',
      },
    },
    restaurantUid: 'rest123',
    event: 'message.received',
  },
});
