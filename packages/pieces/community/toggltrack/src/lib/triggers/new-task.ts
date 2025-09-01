import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const newTask = createTrigger({
  auth: toggleTrackAuth,
  name: 'newTask',
  displayName: 'New Task',
  description: 'Fires when a new task is created.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.track.toggl.com/api/v9/me/workspaces',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${auth}:api_token`).toString('base64')}`,
            },
          });
          
          if (response.status === 200) {
            return {
              options: response.body.map((workspace: any) => ({
                label: workspace.name,
                value: workspace.id,
              })),
            };
          }
        } catch (error) {
          return { options: [] };
        }
        
        return { options: [] };
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  
  async onEnable(context) {
    await context.store?.put('_last_check', new Date().toISOString());
  },

  async onDisable(context) {
    await context.store?.delete('_last_check');
  },

  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId } = props;
    
    try {
      const lastCheckRaw = await context.store?.get('_last_check');
      const lastCheckDate = typeof lastCheckRaw === 'string' ? new Date(lastCheckRaw) : new Date(0);
      
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/tasks`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });

      if (response.status !== 200) return [];

      const tasks = Array.isArray(response.body) ? response.body : [];
      const newTasks = tasks.filter((task: any) => {
        if (!task.created_at) return false;
        return new Date(task.created_at) > lastCheckDate;
      });

      await context.store?.put('_last_check', new Date().toISOString());

      return newTasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        project_id: task.project_id,
        workspace_id: task.workspace_id,
        created_at: task.created_at,
      }));

    } catch (error) {
      return [];
    }
  },

  sampleData: {
    id: 13427273,
    name: "Design homepage mockup",
    project_id: 193791763,
    workspace_id: 3134975,
    created_at: "2025-09-01T10:30:00+00:00",
    user_id: 9876543,
    estimated_seconds: 14400,
    active: true,
    tracked_seconds: 0
  },
});
