import { createTimelinesAiTrigger } from '../common/trigger';

export const newSentMessageTrigger = createTimelinesAiTrigger({
  name: 'new_sent_message',
  displayName: 'New Sent Message',
  description: 'Fires when a new message is sent from your account.',
  eventType: 'new_sent_message',
  sampleData: {
    uid: 'msg_abcdef123456',
    chat_id: 'chat_987654321',
    text: 'Thank you for your inquiry. We will get back to you shortly.',
    sender: {
      name: 'Support Team',
      is_me: true,
    },
    timestamp: 1727360100,
    chat: {
      id: 'chat_987654321',
      name: 'New Customer',
      phone: '14155552673',
    },
  },
});
