import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../../';

export const newOutgoingMessage = createTrigger({
  auth: respondIoAuth,
  name: 'newOutgoingMessage',
  displayName: 'New Outgoing Message',
  description: 'Fires when a message is sent from Respond.io',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'msg_124',
    type: 'outgoing',
    content: 'Thank you for your message. How can I help you?',
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
    timestamp: '2024-01-01T12:01:00Z',
  },
  onEnable: async (context) => {
    const { apiKey, workspaceId } = context.auth;
    
    // Register webhook with Respond.io
    const webhookUrl = context.webhookUrl;
    
    console.log(`Webhook registered: ${webhookUrl}`);
    
    context.app.createListeners({
      events: ['message.outgoing'],
      identifierValue: workspaceId,
    });
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for outgoing messages only
    if (payload.type !== 'outgoing') {
      return [];
    }
    
    return [payload];
  },
}); 