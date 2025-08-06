import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';

export const opportunityStatusUpdated = createTrigger({
  auth: sellsyAuth,
  name: 'opportunity_status_updated',
  displayName: 'Opportunity Status Updated',
  description: 'Fires when an opportunity status is updated',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'opportunity_123',
    title: 'Sales Opportunity',
    oldStage: 'Qualified',
    newStage: 'Proposal',
    amount: 50000,
    currency: 'USD',
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
    
    if (payload.event !== 'opportunity.status_updated') {
      return [];
    }
    
    return [payload];
  },
}); 