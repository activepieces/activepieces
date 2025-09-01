import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const newTimeEntry = createTrigger({
  auth: toggleTrackAuth,
  name: 'newTimeEntry',
  displayName: 'New Time Entry',
  description: 'Fires when a new time entry is added.',
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
        url: `https://api.track.toggl.com/api/v9/me/time_entries`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });

      if (response.status !== 200) return [];

      const timeEntries = Array.isArray(response.body) ? response.body : [];
      const workspaceEntries = timeEntries.filter((entry: any) => entry.workspace_id === workspaceId);
      const newEntries = workspaceEntries.filter((entry: any) => {
        if (!entry.created_at) return false;
        return new Date(entry.created_at) > lastCheckDate;
      });

      await context.store?.put('_last_check', new Date().toISOString());

      return newEntries.map((entry: any) => ({
        id: entry.id,
        description: entry.description,
        project_id: entry.project_id,
        task_id: entry.task_id,
        workspace_id: entry.workspace_id,
        duration: entry.duration,
        created_at: entry.created_at,
      }));

    } catch (error) {
      return [];
    }
  },

  sampleData: {
    id: 2849422448,
    description: "Replying to Emails",
    project_id: 193791763,
    task_id: 13427273,
    workspace_id: 3134975,
    created_at: "2025-09-01T10:30:00+00:00",
    start: "2025-09-01T09:30:00+00:00",
    stop: "2025-09-01T10:30:00+00:00",
    duration: 3600,
    user_id: 9876543,
    uid: 9876543,
    wid: 3134975,
    pid: 193791763,
    tid: 13427273,
    billable: true,
    tags: ["retainer", "client-work"],
    duronly: false,
    at: "2025-09-01T10:30:00+00:00"
  },
});
