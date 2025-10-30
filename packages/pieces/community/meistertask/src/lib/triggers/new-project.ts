import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getProjects } from '../api';

export const newProjectTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 12345,
    name: 'Sample Project',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    status: 1,
  },
  async onEnable() {},
  async onDisable() {},
  async run({ auth, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    const projects = await getProjects(auth);
    
    const newProjects = projects.filter((p: any) => {
      if (!p.created_at) return false;
      const createdAt = new Date(p.created_at);
      return createdAt.getTime() > lastFetchTime;
    });

    if (newProjects.length > 0) {
      const latestTime = Math.max(...newProjects.map((p: any) => new Date(p.created_at).getTime()));
      await store.put('lastFetchTime', latestTime);
    }

    return newProjects;
  },
});
