import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../../';

export const conversationOpened = createTrigger({
  auth: respondIoAuth,
  name: 'conversationOpened',
  displayName: 'Conversation Opened',
  description: 'Fires when a new conversation is opened',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'conv_789',
    status: 'open',
    contact: {
      id: 'contact_456',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    channel: 'whatsapp',
    timestamp: '2024-01-01T12:00:00Z',
  },
  onEnable: async (context) => {
    const { apiKey, workspaceId } = context.auth;
    
    const webhookUrl = context.webhookUrl;
    
    console.log(`Webhook registered: ${webhookUrl}`);
    
    context.app.createListeners({
      events: ['conversation.opened'],
      identifierValue: workspaceId,
    });
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for conversation opened events
    if (payload.event !== 'conversation.opened') {
      return [];
    }
    
    return [payload];
  },
}); 