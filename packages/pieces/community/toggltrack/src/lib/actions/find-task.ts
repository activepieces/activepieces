import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const findTask = createAction({
  auth: toggleTrackAuth,
  name: 'findTask',
  displayName: 'Find Task',
  description: 'Find a task by name and status.',
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
      description: 'Select the project',
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
    taskName: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    activeStatus: Property.StaticDropdown({
      displayName: 'Status Filter',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'both' },
          { label: 'Active', value: 'active' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId, projectId, taskName, activeStatus } =props;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
      });

      if (response.status === 200) {
        let tasks = response.body;

        // Filter by status if specified
        if (activeStatus && activeStatus !== 'both') {
          tasks = tasks.filter((task: any) => {
            return activeStatus === 'active'
              ? task.active === true
              : task.active === false;
          });
        }

        // Filter by name
        const matchingTasks = tasks.filter(
          (task: any) => task.name.toLowerCase() === taskName.toLowerCase()
        );

        return {
          success: true,
          tasks: matchingTasks,
          count: matchingTasks.length,
        };
      } else {
        return {
          success: false,
          error: `API request failed with status ${response.status}`,
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
