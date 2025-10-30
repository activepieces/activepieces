import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getProjects, getTasks, apiRequest } from '../api';
import { HttpMethod } from '@activepieces/pieces-common';

export const newChecklistItemTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_checklist_item',
  displayName: 'New Checklist Item',
  description: 'Triggers when a new checklist item is added to a task.',
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
      }
    }),
    task_id: Property.Dropdown({
      displayName: 'Task',
      required: true,
      refreshers: ['project_id'],
      options: async ({ auth, project_id }) => {
        if (!auth || !project_id) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a project first',
          };
        }
        try {
          const tasks = await getTasks(auth as any, project_id as string);
          return {
            disabled: false,
            options: tasks.map((t: any) => ({ label: t.name, value: t.id })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching tasks',
          };
        }
      }
    }),
  },
  sampleData: {
    id: 12345,
    name: 'Sample checklist item',
    completed: false,
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    task_id: 67890,
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
      const items = await apiRequest<any[]>(auth, HttpMethod.GET, `/tasks/${propsValue.task_id}/checklist_items`);
      
      const newItems = items.filter(i => {
        if (!i.created_at) return false;
        const createdAt = new Date(i.created_at);
        return createdAt.getTime() > lastFetchTime;
      });

      if (newItems.length > 0) {
        const latestTime = Math.max(...newItems.map(i => new Date(i.created_at).getTime()));
        await store.put('lastFetchTime', latestTime);
      }

      return newItems;
    } catch (error) {
      throw new Error(`Failed to fetch checklist items: ${error}`);
    }
  },
});
