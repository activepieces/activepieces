import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';

export const companyUpdated = createTrigger({
  auth: sellsyAuth,
  name: 'company_updated',
  displayName: 'Company Updated',
  description: 'Fires when a company is updated',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'company_123',
    name: 'Example Corp',
    email: 'info@example.com',
    phone: '+1234567890',
    website: 'https://example.com',
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
    
    if (payload.event !== 'company.updated') {
      return [];
    }
    
    return [payload];
  },
}); 