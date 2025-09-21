import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const newOpportunitiesTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_opportunities',
  displayName: 'New Opportunities',
  description: 'Triggers when a new opportunity is created in Capsule CRM',
  
  props: {},
  
  type: TriggerStrategy.POLLING,
  
  sampleData: {
    id: 123456,
    name: 'Sample Opportunity',
    value: {
      amount: 5000,
      currency: 'USD'
    },
    party: {
      id: 789,
      name: 'Sample Contact'
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  
  async onEnable(context) {
    // Store the current timestamp to track new opportunities
    await context.store.put('_lastCheck', new Date().toISOString());
  },

  async onDisable(context) {
    await context.store.delete('_lastCheck');
  },

  async run(context) {
    const lastCheck = await context.store.get('_lastCheck') as string;
    const currentTime = new Date().toISOString();

    let endpoint = '/opportunities?perPage=50&sort=createdAt:desc';
    
    if (lastCheck) {
      endpoint += `&filter[createdAt][after]=${lastCheck}`;
    }

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      endpoint
    );

    const opportunities = response.opportunities || [];
    
    // Update the last check timestamp
    await context.store.put('_lastCheck', currentTime);

    return opportunities.map((opportunity: any) => ({
      id: opportunity.id,
      name: opportunity.name,
      value: opportunity.value,
      party: opportunity.party,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    }));
  },

  async test(context) {
    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      '/opportunities?perPage=5&sort=createdAt:desc'
    );

    const opportunities = response.opportunities || [];
    
    return opportunities.map((opportunity: any) => ({
      id: opportunity.id,
      name: opportunity.name,
      value: opportunity.value,
      party: opportunity.party,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    }));
  },
});
