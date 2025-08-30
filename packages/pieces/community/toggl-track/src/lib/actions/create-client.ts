import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const createClient = createAction({
  auth: togglTrackAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Create a new client in a workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Client Name',
      description: 'The name of the new client.',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes for the client.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, name, notes } = context.propsValue;
    const apiToken = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/clients`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name,
        notes,
      },
    });

    return response.body;
  },
});