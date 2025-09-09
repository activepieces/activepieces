import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const findClient = createAction({
  auth: togglTrackAuth,
  name: 'find_client',
  displayName: 'Find Client',
  description: 'Find a client by name or status in a workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
        displayName: 'Client Name',
        description: 'The name of the client to find (case-insensitive).',
        required: false,
    }),
    status: Property.StaticDropdown({
        displayName: 'Status',
        description: 'Filter clients by their status.',
        required: false,
        options: {
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Archived', value: 'archived' },
                { label: 'Both', value: 'both' },
            ]
        }
    })
  },
  async run(context) {
    const { workspace_id, name, status } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: QueryParams = {};
    if (name) {
        queryParams['name'] = name;
    }
    if (status) {
        queryParams['status'] = status;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/clients`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams: queryParams
    });

    return response.body;
  },
});