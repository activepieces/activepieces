import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const newTasksTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_tasks',
  displayName: 'New Tasks',
  description: 'Triggers when a new task is created in Capsule CRM',
  
  props: {},
  
  type: TriggerStrategy.POLLING,
  
  sampleData: {
    id: 123456,
    description: 'Sample task description',
    dueDate: '2024-01-20T09:00:00Z',
    category: 'Call',
    completed: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  
  async onEnable(context) {
    await context.store.put('_lastCheck', new Date().toISOString());
  },

  async onDisable(context) {
    await context.store.delete('_lastCheck');
  },

  async run(context) {
    const lastCheck = await context.store.get('_lastCheck') as string;
    const currentTime = new Date().toISOString();

    let endpoint = '/tasks?perPage=50&sort=createdAt:desc';
    
    if (lastCheck) {
      endpoint += `&filter[createdAt][after]=${lastCheck}`;
    }

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      endpoint
    );

    const tasks = response.tasks || [];
    
    await context.store.put('_lastCheck', currentTime);

    return tasks;
  },

  async test(context) {
    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      '/tasks?perPage=5&sort=createdAt:desc'
    );

    return response.tasks || [];
  },
});
