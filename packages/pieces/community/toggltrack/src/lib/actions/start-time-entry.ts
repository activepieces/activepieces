import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const startTimeEntry = createAction({
  auth: toggleTrackAuth,
  name: 'startTimeEntry',
  displayName: 'Start Time Entry',
  description: 'Start a live time entry.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace to start time entry',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.track.toggl.com/api/v9/me/workspaces',
            headers: {
              Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString(
                'base64'
              )}`,
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
              Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString(
                'base64'
              )}`,
            },
          });

          if (response.status === 200) {
            return {
              options: response.body
                .filter((project: any) => project.active === true) // Only show active projects
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
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId, description, projectId } = props;

    try {
      const requestBody: any = {
        description: description.trim(),
        workspace_id: workspaceId,
        start: new Date().toISOString(),
        duration: -1, // Negative value indicates running timer
        created_with: 'activepieces',
      };

      if (projectId) {
        requestBody.project_id = projectId;
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
        body: requestBody,
      });

      if (response.status === 200 || response.status === 201) {
        const timeEntry = response.body;
        return {
          id: timeEntry.id,
          description: timeEntry.description,
          start: timeEntry.start,
          project_id: timeEntry.project_id,
          workspace_id: timeEntry.workspace_id,
          running: true,
        };
      } else {
        return {
          success: false,
          error: `Failed to start time entry: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
