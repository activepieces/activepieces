import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const createProject = createAction({
  auth: toggleTrackAuth,
  name: 'createProject',
  displayName: 'Create Project',
  description:
    'Create a new project with properties like template, privacy, billable, client.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace where the project will be created',
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
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project to create',
      required: true,
    }),
    clientId: Property.Dropdown({
      displayName: 'Client',
      description:
        'Select the client to associate with this project (optional)',
      required: false,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return { options: [] };
        }
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`,
            headers: {
              Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString(
                'base64'
              )}`,
            },
          });
          if (response.status === 200) {
            const clients = response.body;
            return {
              options: clients.map((client: any) => ({
                label: client.name,
                value: client.id,
              })),
            };
          }
        } catch {
          return { options: [] };
        }
        return { options: [] };
      },
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Private Project',
      description: 'Make this project private',
      required: false,
      defaultValue: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Make this project billable',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId, name, clientId, isPrivate, billable } = props;
    try {
      const requestBody: any = {
        name: name.trim(),
        workspace_id: workspaceId,
        is_private: isPrivate,
        billable: billable,
      };
      if (clientId) {
        requestBody.client_id = clientId;
      }
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
        body: requestBody,
      });
      if (response.status === 200 || response.status === 201) {
        const project = response.body;
        return {
          id: project.id,
          name: project.name,
          workspace_id: project.workspace_id,
          client_id: project.client_id,
          is_private: project.is_private,
          billable: project.billable,
          created_at: project.created_at,
        };
      } else {
        return {
          success: false,
          error: `Failed to create project: ${response.status}`,
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
