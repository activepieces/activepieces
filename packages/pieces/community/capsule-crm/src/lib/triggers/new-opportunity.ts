import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS, CapsuleOpportunity } from '../common';

export const newOpportunityTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Triggers when a new opportunity is created in Capsule CRM.',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    console.log('New opportunity trigger enabled');
  },
  onDisable: async (context) => {
    console.log('New opportunity trigger disabled');
  },
  test: async (context) => {
    const response = await makeApiCall(
      context.auth,
      `${API_ENDPOINTS.OPPORTUNITIES}?perPage=5&sort=createdAt:desc`,
      'GET'
    );

    if (response.status === 200 && response.body.opportunities) {
      return response.body.opportunities;
    }

    return [];
  },
  run: async (context) => {
    const lastCheck = await context.store?.get<string>('lastCheck');
    let since = '';

    if (lastCheck) {
      since = `&since=${lastCheck}`;
    }

    const response = await makeApiCall(
      context.auth,
      `${API_ENDPOINTS.OPPORTUNITIES}?perPage=100&sort=createdAt:desc${since}`,
      'GET'
    );

    if (response.status === 200 && response.body.opportunities) {
      const currentTime = new Date().toISOString();
      await context.store?.put('lastCheck', currentTime);

      return response.body.opportunities.filter((opportunity: CapsuleOpportunity) => {
        if (!lastCheck) return true;
        return new Date(opportunity.createdAt) > new Date(lastCheck);
      });
    }

    return [];
  },
  sampleData: {
    id: 12345,
    name: 'Sample Opportunity',
    description: 'This is a sample opportunity description',
    party: {
      id: 67890,
      name: 'Sample Client'
    },
    milestone: {
      id: 789,
      name: 'Proposal'
    },
    value: {
      amount: 50000,
      currency: 'USD'
    },
    expectedCloseOn: '2024-03-15',
    probability: 75,
    duration: 30,
    owner: {
      id: 123,
      name: 'John Doe'
    },
    team: {
      id: 456,
      name: 'Sales Team'
    },
    tags: [],
    fields: [],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
});