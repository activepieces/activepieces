import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const newProject = createTrigger({
  auth: toggleTrackAuth,
  name: 'newProject',
  displayName: 'New Project',
  description: 'Fires when a new project is added.',
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
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });

      if (response.status !== 200) return [];

      const projects = Array.isArray(response.body) ? response.body : [];
      const newProjects = projects.filter((project: any) => {
        if (!project.created_at) return false;
        return new Date(project.created_at) > lastCheckDate;
      });

      await context.store?.put('_last_check', new Date().toISOString());

      return newProjects.map((project: any) => ({
        id: project.id,
        name: project.name,
        workspace_id: project.workspace_id,
        client_id: project.client_id,
        created_at: project.created_at,
      }));

    } catch (error) {
      return [];
    }
  },

  sampleData: {
    id: 193791763,
    name: "Website Redesign Project",
    workspace_id: 3134975,
    client_id: 123456789,
    created_at: "2025-09-01T10:30:00+00:00",
    is_private: false,
    active: true,
    color: "#0b83d9",
    billable: true,
    template: false,
    auto_estimates: false,
    estimated_hours: 160,
    rate: 75.00,
    rate_last_updated: "2025-09-01T10:30:00+00:00",
    currency: "USD",
    recurring: false
  },
});
