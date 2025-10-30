import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getProjects, apiRequest } from '../api';
import { HttpMethod } from '@activepieces/pieces-common';

export const newTaskTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created or changed.',
  type: TriggerStrategy.POLLING,
  props: {
    project_id: Property.Dropdown({
      displayName: 'Project',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const projects = await getProjects(auth as any);
          return {
            disabled: false,
            options: projects.map((p: any) => ({ label: p.name, value: p.id })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching projects',
          };
        }
      },
    }),
  },
  sampleData: {
    id: 12345,
    name: 'Sample Task',
    notes: 'This is a sample task description',
    status: 1,
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    section_id: 67890,
    project_id: 54321,
  },
  async onEnable() {
    // No webhook setup needed for polling trigger
  },
  async onDisable() {
    // No webhook cleanup needed for polling trigger
  },
  async run({ auth, propsValue, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    try {
      const tasks = await apiRequest<any[]>(auth, HttpMethod.GET, `/projects/${propsValue.project_id}/tasks`);
      
      const newOrUpdatedTasks = tasks.filter(task => {
        if (!task.updated_at) return false;
        const updatedAt = new Date(task.updated_at);
        return updatedAt.getTime() > lastFetchTime;
      });

      if (newOrUpdatedTasks.length > 0) {
        const latestTime = Math.max(...newOrUpdatedTasks.map(task => new Date(task.updated_at).getTime()));
        await store.put('lastFetchTime', latestTime);
      }

      return newOrUpdatedTasks;
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error}`);
    }
  },
});
