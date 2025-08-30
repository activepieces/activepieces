import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const newOpportunityTrigger = createTrigger({
  auth: wealthboxCrmAuth,
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Triggers when a new opportunity is created',
  type: TriggerStrategy.POLLING,
  props: {
    polling_interval: Property.Number({
      displayName: 'Polling Interval (seconds)',
      required: false,
      defaultValue: 60,
      description: 'How often to check for new opportunities (minimum 60 seconds)',
    }),
  },
  async onEnable(context) {
    await context.store.put('last_opportunity_id', 0);
  },
  async run(context) {
    const { polling_interval = 60 } = context.propsValue;
    const lastOpportunityId = await context.store.get('last_opportunity_id') || 0;
    
    const client = makeClient(context.auth);
    const opportunities = await client.listOpportunities();
    
    const newOpportunities = opportunities.opportunities.filter((opportunity: any) => opportunity.id > lastOpportunityId);
    
    if (newOpportunities.length > 0) {
      const maxOpportunityId = Math.max(...newOpportunities.map((opportunity: any) => opportunity.id));
      await context.store.put('last_opportunity_id', maxOpportunityId);
    }
    
    return newOpportunities;
  },
  sampleData: {
    id: 1,
    type: 'Opportunity',
    name: 'New Investment Portfolio',
    description: 'Client looking to invest $100k in diversified portfolio',
    contact_id: 123,
    stage: 'Prospecting',
    amount: 100000,
    close_date: '2024-06-30T23:59:59Z',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
});
