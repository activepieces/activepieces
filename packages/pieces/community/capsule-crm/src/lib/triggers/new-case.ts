import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS, CapsuleProject } from '../common';

export const newCaseTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_case',
  displayName: 'New Case',
  description: 'Triggers when a new case (project) is created in Capsule CRM.',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    console.log('New case trigger enabled');
  },
  onDisable: async (context) => {
    console.log('New case trigger disabled');
  },
  test: async (context) => {
    const response = await makeApiCall(
      context.auth,
      `${API_ENDPOINTS.PROJECTS}?perPage=5&sort=createdAt:desc`,
      'GET'
    );

    if (response.status === 200 && response.body.kases) {
      return response.body.kases;
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
      `${API_ENDPOINTS.PROJECTS}?perPage=100&sort=createdAt:desc${since}`,
      'GET'
    );

    if (response.status === 200 && response.body.kases) {
      const currentTime = new Date().toISOString();
      await context.store?.put('lastCheck', currentTime);

      return response.body.kases.filter((kase: CapsuleProject) => {
        if (!lastCheck) return true;
        return new Date(kase.createdAt) > new Date(lastCheck);
      });
    }

    return [];
  },
  sampleData: {
    id: 12345,
    name: 'Sample Project',
    description: 'This is a sample project description',
    status: 'OPEN',
    party: {
      id: 67890,
      name: 'Sample Client'
    },
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
    updatedAt: '2024-01-15T10:30:00Z',
    expectedCloseOn: '2024-02-15'
  }
});