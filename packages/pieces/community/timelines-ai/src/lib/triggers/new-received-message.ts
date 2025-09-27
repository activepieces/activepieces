import { createTimelinesAiTrigger } from '../common/trigger';

export const newReceivedMessageTrigger = createTimelinesAiTrigger({
  name: 'new_received_message',
  displayName: 'New Received Message',
  description: 'Fires when a new message is received from a contact.',
  eventType: 'new_received_message',
  sampleData: {
    uid: 'msg_fedcba654321',
    chat_id: 'chat_135792468',
    text: 'Hello, I have a question about my order.',
    sender: {
      name: 'Potential Customer',
      is_me: false,
    },
    timestamp: 1727364600,
    chat: {
      id: 'chat_135792468',
      name: 'Potential Customer',
      phone: '14155552674',
    },
  },
});
