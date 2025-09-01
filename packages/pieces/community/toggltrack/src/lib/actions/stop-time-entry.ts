import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const stopTimeEntry = createAction({
  auth: toggleTrackAuth,
  name: 'stopTimeEntry',
  displayName: 'Stop Time Entry',
  description: 'Stops the running time entry.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace where the task will be created',
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
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId } = props;
    
    try {
      // First, get the current running time entry
      const currentResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.track.toggl.com/api/v9/me/time_entries/current',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
      });
      
      if (currentResponse.status !== 200 || !currentResponse.body) {
        return {
          success: false,
          error: 'No running time entry found',
        };
      }
      
      const runningEntry = currentResponse.body;
      
      // Check if the running entry is in the specified workspace
      if (runningEntry.workspace_id !== workspaceId) {
        return {
          success: false,
          error: 'Running time entry is not in the specified workspace',
        };
      }
      
      // Stop the time entry by updating it with stop time
      const stopResponse = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries/${runningEntry.id}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
        body: {
          stop: new Date().toISOString(),
        },
      });
      
      if (stopResponse.status === 200) {
        const stoppedEntry = stopResponse.body;
        return {
          id: stoppedEntry.id,
          description: stoppedEntry.description,
          start: stoppedEntry.start,
          stop: stoppedEntry.stop,
          duration: stoppedEntry.duration,
          project_id: stoppedEntry.project_id,
          workspace_id: stoppedEntry.workspace_id,
          running: false,
        };
      } else {
        return {
          success: false,
          error: `Failed to stop time entry: ${stopResponse.status}`,
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
