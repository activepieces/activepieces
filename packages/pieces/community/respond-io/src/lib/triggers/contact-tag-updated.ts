import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../../';

export const contactTagUpdated = createTrigger({
  auth: respondIoAuth,
  name: 'contactTagUpdated',
  displayName: 'Contact Tag Updated',
  description: 'Fires when tags are added or removed on a contact',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'contact_456',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    tags: ['vip-customer', 'support'],
    updated_at: '2024-01-01T12:20:00Z',
    tag_changes: {
      added: ['vip-customer'],
      removed: ['new-customer'],
    },
  },
  onEnable: async (context) => {
    const { apiKey, workspaceId } = context.auth;
    
    const webhookUrl = context.webhookUrl;
    
    console.log(`Webhook registered: ${webhookUrl}`);
    
    context.app.createListeners({
      events: ['contact.tags.updated'],
      identifierValue: workspaceId,
    });
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for contact tag updated events
    if (payload.event !== 'contact.tags.updated') {
      return [];
    }
    
    return [payload];
  },
}); 