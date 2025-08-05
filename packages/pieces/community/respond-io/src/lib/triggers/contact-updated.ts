import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../../';

export const contactUpdated = createTrigger({
  auth: respondIoAuth,
  name: 'contactUpdated',
  displayName: 'Contact Updated',
  description: 'Fires when any contact field is updated',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'contact_456',
    name: 'John Doe Updated',
    email: 'john.updated@example.com',
    phone: '+1234567890',
    tags: ['vip-customer'],
    updated_at: '2024-01-01T12:15:00Z',
    changes: {
      name: 'John Doe Updated',
      tags: ['vip-customer'],
    },
  },
  onEnable: async (context) => {
    const { apiKey, workspaceId } = context.auth;
    
    const webhookUrl = context.webhookUrl;
    
    console.log(`Webhook registered: ${webhookUrl}`);
    
    context.app.createListeners({
      events: ['contact.updated'],
      identifierValue: workspaceId,
    });
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for contact updated events
    if (payload.event !== 'contact.updated') {
      return [];
    }
    
    return [payload];
  },
}); 