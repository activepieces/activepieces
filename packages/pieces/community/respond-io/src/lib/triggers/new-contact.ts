import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../../';

export const newContact = createTrigger({
  auth: respondIoAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Fires when a contact is created',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'contact_456',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    tags: ['new-customer'],
    created_at: '2024-01-01T12:00:00Z',
  },
  onEnable: async (context) => {
    const { apiKey, workspaceId } = context.auth;
    
    const webhookUrl = context.webhookUrl;
    
    console.log(`Webhook registered: ${webhookUrl}`);
    
    context.app.createListeners({
      events: ['contact.created'],
      identifierValue: workspaceId,
    });
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for contact created events
    if (payload.event !== 'contact.created') {
      return [];
    }
    
    return [payload];
  },
}); 