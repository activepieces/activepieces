import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const findProject = createAction({
  auth: toggleTrackAuth,
  name: 'findProject',
  displayName: 'Find Project',
  description: 'Find a project by name.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'The workspace to search projects in',
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
    projectName: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project to find',
      required: true,
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId, projectName } = props;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`,
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
      });

      if (response.status === 200) {
        const projects = response.body;
        const matchingProjects = projects.filter(
          (project: any) =>
            project.name.toLowerCase() === projectName.toLowerCase()
        );

        return {
          success: true,
          projects: matchingProjects,
          count: matchingProjects.length,
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
