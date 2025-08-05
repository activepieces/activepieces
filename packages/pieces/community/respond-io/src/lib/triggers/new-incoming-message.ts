import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../../';

export const newIncomingMessage = createTrigger({
  auth: respondIoAuth,
  name: 'newIncomingMessage',
  displayName: 'New Incoming Message',
  description: 'Fires when a new message is received on any channel',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'msg_123',
    type: 'incoming',
    content: 'Hello, I need help with my order',
    channel: 'whatsapp',
    contact: {
      id: 'contact_456',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    conversation: {
      id: 'conv_789',
      status: 'open',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  onEnable: async (context) => {
    const { apiKey, workspaceId } = context.auth;
    
    // Register webhook with Respond.io
    const webhookUrl = context.webhookUrl;
    
    // This would typically register the webhook with Respond.io API
    // For now, we'll simulate the registration
    console.log(`Webhook registered: ${webhookUrl}`);
    
    context.app.createListeners({
      events: ['message.incoming'],
      identifierValue: workspaceId,
    });
  },
  onDisable: async (context) => {
    // Clean up webhook registration
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for incoming messages only
    if (payload.type !== 'incoming') {
      return [];
    }
    
    return [payload];
  },
}); 