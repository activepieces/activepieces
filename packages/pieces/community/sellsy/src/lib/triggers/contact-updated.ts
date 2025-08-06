import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';

export const contactUpdated = createTrigger({
  auth: sellsyAuth,
  name: 'contact_updated',
  displayName: 'Contact Updated',
  description: 'Fires when a contact is updated',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'contact_123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Example Corp',
    position: 'Manager',
    updatedAt: '2024-01-01T12:00:00Z',
  },
  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    console.log(`Webhook registered: ${webhookUrl}`);
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload.event !== 'contact.updated') {
      return [];
    }
    
    return [payload];
  },
}); 