import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';

export const newOpportunity = createTrigger({
  auth: sellsyAuth,
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Fires when a new opportunity is created',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'opportunity_123',
    title: 'New Sales Opportunity',
    amount: 50000,
    currency: 'USD',
    stage: 'Qualified',
    contactId: 'contact_123',
    companyId: 'company_123',
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
    
    if (payload.event !== 'opportunity.created') {
      return [];
    }
    
    return [payload];
  },
}); 