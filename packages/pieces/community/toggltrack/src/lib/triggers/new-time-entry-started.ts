import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const newTimeEntryStarted = createTrigger({
  auth: toggleTrackAuth,
  name: 'newTimeEntryStarted',
  displayName: 'New Time Entry Started',
  description: 'Fires when a time entry is started and is currently running.',
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
    await context.store?.put('_last_running_entry', '');
  },

  async onDisable(context) {
    await context.store?.delete('_last_running_entry');
  },

  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId } = props;
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/me/time_entries/current`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });

      if (response.status !== 200 || !response.body) return [];

      const runningEntry = response.body;
      
      // Check if this entry is in the specified workspace
      if (runningEntry.workspace_id !== workspaceId) return [];

      // Check if this is a new running entry
      const lastRunningId = await context.store?.get('_last_running_entry');
      if (lastRunningId === runningEntry.id.toString()) return [];

      // Store current running entry ID
      await context.store?.put('_last_running_entry', runningEntry.id.toString());

      return [{
        id: runningEntry.id,
        description: runningEntry.description,
        project_id: runningEntry.project_id,
        task_id: runningEntry.task_id,
        workspace_id: runningEntry.workspace_id,
        start_time: runningEntry.start,
      }];

    } catch (error) {
      return [];
    }
  },

  sampleData: {
    id: 2849422449,
    description: "Working on design concepts",
    project_id: 193791763,
    task_id: 13427273,
    workspace_id: 3134975,
    start_time: "2025-09-01T10:30:00+00:00",
    user_id: 9876543,
    billable: true,
    tags: ["design", "active"],
    duration: -1699695830, // Negative value indicates running timer
    at: "2025-09-01T10:30:00+00:00"
  },
});
