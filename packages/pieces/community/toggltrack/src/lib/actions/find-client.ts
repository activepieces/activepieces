import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';
import { convertIdsToInt } from '../utils/convert-ids';

export const findClient = createAction({
  auth: toggleTrackAuth,
  name: 'findClient',
  displayName: 'Find Client',
  description: 'Find a client by name or status.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace where you want to find the client',
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
    clientName: Property.ShortText({
      displayName: 'Client Name',
      required: true,
    }),
    activeStatus: Property.StaticDropdown({
      displayName: 'Status Filter',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { workspaceId, clientName, activeStatus } = props;
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`,
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
      });
      if (response.status === 200) {
        let clients = response.body;
        if (activeStatus) {
          clients = clients.filter((client: any) => {
            return activeStatus === 'active'
              ? client.archived === false
              : client.archived === true;
          });
        }
        const matchingClients = clients.filter(
          (client: any) =>
            client.name.toLowerCase() === clientName.toLowerCase()
        );
        return {
          success: true,
          clients: matchingClients,
          count: matchingClients.length,
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
