import { createTimelinesAiTrigger } from '../common/trigger';

export const newWhatsappAccountTrigger = createTimelinesAiTrigger({
  name: 'new_whatsapp_account',
  displayName: 'New WhatsApp Account',
  description:
    'Fires when a new WhatsApp account is connected to the workspace.',
  eventType: 'whatsapp_account_connected',
  sampleData: {
    id: 'wa_account_54321',
    phone: '14155552675',
    name: 'Marketing Team',
  },
});
