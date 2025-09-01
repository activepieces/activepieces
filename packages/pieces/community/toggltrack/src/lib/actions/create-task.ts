import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const createTask = createAction({
  auth: toggleTrackAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Create a new task under a project.',
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
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name of the task to create',
      required: true,
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId, projectId, name } = props;
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
        body: {
          name: name.trim(),
          project_id: projectId,
        },
      });
      if (response.status === 200 || response.status === 201) {
        const task = response.body;
        return {
          id: task.id,
          name: task.name,
          project_id: task.project_id,
          workspace_id: task.workspace_id,
          created_at: task.created_at,
        };
      } else {
        return {
          success: false,
          error: `Failed to create task: ${response.status}`,
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
