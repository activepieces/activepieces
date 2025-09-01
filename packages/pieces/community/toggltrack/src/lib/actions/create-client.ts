import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const createClient = createAction({
  auth: toggleTrackAuth,
  name: 'createClient',
  displayName: 'Create Client',
  description: 'Create a new client in a workspace.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace where client will added',
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
    name: Property.ShortText({
      displayName: 'Client Name',
      description: 'Name of the client to create',
      required: true,
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue); 
    const { workspaceId, name } = props;

    try {
      const requestBody = {
        name: name.trim(),
        wid: workspaceId
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
        },
        body: requestBody,
      });

      if (response.status === 200 || response.status === 201) {
        const client = response.body;

        return {
          id: client.id,
          name: client.name,
          workspace_id: client.wid,
          created_at: client.at,
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
