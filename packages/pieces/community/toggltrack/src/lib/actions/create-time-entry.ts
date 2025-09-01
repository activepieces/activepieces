import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const createTimeEntry = createAction({
  auth: toggleTrackAuth,
  name: 'createTimeEntry',
  displayName: 'Create Time Entry',
  description: 'Manually create a time entry with start, duration, description, and tags.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace where the new time entry will be created',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.track.toggl.com/api/v9/me/workspaces',
            headers: {
              Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString('base64')}`,
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
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Description of the time entry',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
      description: 'Duration of the time entry in seconds',
      required: true,
    }),
    projectId: Property.Dropdown({
      displayName: 'Project',
      description: 'Select the project where the task will be created',
      required: true,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return { options: [] };
        }
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`,
            headers: {
              Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString('base64')}`,
            },
          });
          if (response.status === 200) {
            return {
              options: response.body
                .filter((project: any) => project.active === true)
                .map((project: any) => ({
                  label: project.name,
                  value: project.id,
                })),
            };
          }
        } catch (error) {
          return { options: [] };
        }
        return { options: [] };
      },
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      description: 'Start time of the entry (ISO format YYYY-MM-DD)',
      required: true,
    }),
  },
  async run(context) {
   const props = convertIdsToInt(context.propsValue);
    const { workspaceId, description, duration, projectId, startTime } = props;

    
    try {
      const requestBody: any = {
        description: description.trim(),
        duration: duration,
        start: startTime,
        workspace_id: parseInt(workspaceId, 10), 
        created_with: 'activepieces',
      };
      
      if (projectId) {
        requestBody.project_id = parseInt(projectId, 10);
      }
      
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.track.toggl.com/api/v9/workspaces/${parseInt(workspaceId, 10)}/time_entries`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
        body: requestBody,
      });
      
      if (response.status === 200 || response.status === 201) {
        const timeEntry = response.body;
        return {
          id: timeEntry.id,
          description: timeEntry.description,
          duration: timeEntry.duration,
          start: timeEntry.start,
          project_id: timeEntry.project_id,
          workspace_id: timeEntry.workspace_id,
          created_at: timeEntry.at,
        };
      } else {
        return {
          success: false,
          error: `Failed to create time entry: ${response.status}`,
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
