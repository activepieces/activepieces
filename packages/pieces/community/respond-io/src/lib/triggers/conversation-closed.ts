import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../../';

export const conversationClosed = createTrigger({
  auth: respondIoAuth,
  name: 'conversationClosed',
  displayName: 'Conversation Closed',
  description: 'Fires when a conversation is closed',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'conv_789',
    status: 'closed',
    contact: {
      id: 'contact_456',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    channel: 'whatsapp',
    timestamp: '2024-01-01T12:30:00Z',
  },
  onEnable: async (context) => {
    const { apiKey, workspaceId } = context.auth;
    
    const webhookUrl = context.webhookUrl;
    
    console.log(`Webhook registered: ${webhookUrl}`);
    
    context.app.createListeners({
      events: ['conversation.closed'],
      identifierValue: workspaceId,
    });
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for conversation closed events
    if (payload.event !== 'conversation.closed') {
      return [];
    }
    
    return [payload];
  },
}); 