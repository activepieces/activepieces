import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const newOpportunity = createTrigger({
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Triggers when a new opportunity is created in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of opportunities to retrieve',
      required: false,
      defaultValue: 10,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'opportunity_123',
    title: 'Investment Portfolio Review',
    description: 'New client seeking portfolio review and investment advice',
    stage: 'prospecting',
    amount: 50000,
    close_date: '2024-03-15',
    contact_id: 'contact_456',
    probability: 75,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  onEnable: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    // Store the current timestamp to only get new opportunities
    await context.store.put('lastOpportunityCheck', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastOpportunityCheck');
  },
  run: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    const lastCheck = await context.store.get<string>('lastOpportunityCheck');
    const limit = context.propsValue.limit || 10;

    try {
      const response = await client.getOpportunities({ limit });
      const opportunities = response.data;

      // Filter opportunities created after the last check
      const newOpportunities = opportunities.filter(opportunity => {
        if (!lastCheck) return true;
        return new Date(opportunity.created_at!) > new Date(lastCheck);
      });

      // Update the last check timestamp
      if (opportunities.length > 0) {
        const latestOpportunity = opportunities.reduce((latest, current) => 
          new Date(current.created_at!) > new Date(latest.created_at!) ? current : latest
        );
        await context.store.put('lastOpportunityCheck', latestOpportunity.created_at);
      }

      return newOpportunities;
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  },
}); 