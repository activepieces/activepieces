import { createTimelinesAiTrigger } from '../common/trigger';

export const newIncomingChatTrigger = createTimelinesAiTrigger({
  name: 'new_incoming_chat',
  displayName: 'New Incoming Chat',
  description: 'Fires when a new chat is initiated by an incoming message.',
  eventType: 'new_incoming_chat',
  sampleData: {
    id: 'chat_135792468',
    name: 'Potential Customer',
    phone: '14155552674',
    whatsapp_account_phone: '14155552670',
  },
});
