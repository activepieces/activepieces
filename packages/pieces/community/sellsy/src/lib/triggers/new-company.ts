import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';

export const newCompany = createTrigger({
  auth: sellsyAuth,
  name: 'new_company',
  displayName: 'New Company',
  description: 'Fires when a new company is created',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'company_123',
    name: 'Example Corp',
    email: 'info@example.com',
    phone: '+1234567890',
    website: 'https://example.com',
    createdAt: '2024-01-01T12:00:00Z',
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
    
    if (payload.event !== 'company.created') {
      return [];
    }
    
    return [payload];
  },
}); 