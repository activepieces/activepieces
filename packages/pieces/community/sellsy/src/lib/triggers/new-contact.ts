import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';

export const newContact = createTrigger({
  auth: sellsyAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created',
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
    createdAt: '2024-01-01T12:00:00Z',
  },
  onEnable: async (context) => {
    const { access_token } = context.auth as { access_token: string };
    
    const webhookUrl = context.webhookUrl;
    
    console.log(`Webhook registered: ${webhookUrl}`);
    
    // Register webhook with Sellsy
    // This would typically involve calling Sellsy's webhook registration endpoint
    // For now, we'll just log the webhook URL
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