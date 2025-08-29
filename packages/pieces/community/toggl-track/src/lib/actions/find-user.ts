import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const findUser = createAction({
  auth: togglTrackAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Find a user in a workspace by their name or email.',
  props: {
    workspace_id: togglCommon.workspace_id,
    search_term: Property.ShortText({
        displayName: 'Name or Email',
        description: 'The name or email of the user to find.',
        required: true,
    }),
  },
  async run(context) {
    const { workspace_id, search_term } = context.propsValue;
    const apiToken = context.auth;

    // 1. Get workspace details to find the organization_id
    const workspaceDetails = await httpClient.sendRequest<{ organization_id: number }>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
            'base64'
            )}`,
        },
    });
    const organization_id = workspaceDetails.body.organization_id;


    // 2. Search for the user within that workspace and organization
    const searchResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/organizations/${organization_id}/workspaces/${workspace_id}/workspace_users`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams: {
        search: search_term,
      }
    });

    return searchResponse.body;
  },
});