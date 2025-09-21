import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS, CapsuleTask } from '../common';

export const newTaskTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in Capsule CRM.',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    console.log('New task trigger enabled');
  },
  onDisable: async (context) => {
    console.log('New task trigger disabled');
  },
  test: async (context) => {
    const response = await makeApiCall(
      context.auth,
      `${API_ENDPOINTS.TASKS}?perPage=5&sort=createdAt:desc`,
      'GET'
    );

    if (response.status === 200 && response.body.tasks) {
      return response.body.tasks;
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
      `${API_ENDPOINTS.TASKS}?perPage=100&sort=createdAt:desc${since}`,
      'GET'
    );

    if (response.status === 200 && response.body.tasks) {
      const currentTime = new Date().toISOString();
      await context.store?.put('lastCheck', currentTime);

      return response.body.tasks.filter((task: CapsuleTask) => {
        if (!lastCheck) return true;
        return new Date(task.createdAt) > new Date(lastCheck);
      });
    }

    return [];
  },
  sampleData: {
    id: 12345,
    description: 'Follow up with client about proposal',
    status: 'OPEN',
    category: {
      id: 789,
      name: 'Follow-up'
    },
    party: {
      id: 67890,
      name: 'Sample Client'
    },
    opportunity: {
      id: 54321,
      name: 'Sample Opportunity'
    },
    kase: {
      id: 98765,
      name: 'Sample Project'
    },
    owner: {
      id: 123,
      name: 'John Doe'
    },
    dueOn: '2024-01-20',
    dueTime: '14:00:00',
    completedAt: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
});