import { createTimelinesAiTrigger } from '../common/trigger';

export const newOutgoingChatTrigger = createTimelinesAiTrigger({
  name: 'new_outgoing_chat',
  displayName: 'New Outgoing Chat',
  description: 'Fires when a new outgoing chat is initiated from your account.',
  eventType: 'new_outgoing_chat',
  sampleData: {
    id: 'chat_987654321',
    name: 'New Customer',
    phone: '14155552673',
    whatsapp_account_phone: '14155552670',
  },
});
