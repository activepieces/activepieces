import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const newProjectsTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_projects',
  displayName: 'New Projects',
  description: 'Triggers when a new project is created in Capsule CRM',
  
  props: {},
  
  type: TriggerStrategy.POLLING,
  
  sampleData: {
    id: 123456,
    name: 'Sample Project',
    description: 'This is a sample project description',
    status: 'Active',
    party: {
      id: 789,
      name: 'Sample Contact'
    },
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

    let endpoint = '/projects?perPage=50&sort=createdAt:desc';
    
    if (lastCheck) {
      endpoint += `&filter[createdAt][after]=${lastCheck}`;
    }

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      endpoint
    );

    const projects = response.projects || [];
    
    await context.store.put('_lastCheck', currentTime);

    return projects;
  },

  async test(context) {
    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      '/projects?perPage=5&sort=createdAt:desc'
    );

    return response.projects || [];
  },
});
