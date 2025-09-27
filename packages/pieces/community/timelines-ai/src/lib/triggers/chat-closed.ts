import { createTimelinesAiTrigger } from '../common/trigger';

export const chatClosedTrigger = createTimelinesAiTrigger({
  name: 'chat_closed',
  displayName: 'Chat Closed',
  description: 'Fires when a chat is marked as closed.',
  eventType: 'chat_closed',
  sampleData: {
    id: 'chat_123456789',
    name: 'John Doe',
    phone: '14155552671',
    state: 'closed',
    whatsapp_account_phone: '14155552670',
    responsible: {
      id: 'user_abcde12345',
      email: 'agent@example.com',
      name: 'Jane Smith',
    },
  },
});
