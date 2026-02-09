import { formitableRegisterTrigger } from './register-trigger';

export const messageSent = formitableRegisterTrigger({
  name: 'message_sent',
  displayName: 'Message Sent by Customer',
  description: 'Triggers when a message is sent by the customer.',
  event: 'message.sent',
  sampleData: {
    data: {
      message: {
        uid: 'msg123',
        content: 'Hello, I have a question about my reservation.',
        sentAt: '2024-01-15T10:30:00Z',
      },
    },
    restaurantUid: 'rest123',
    event: 'message.sent',
  },
});
