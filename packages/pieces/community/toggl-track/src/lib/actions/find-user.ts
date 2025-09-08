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
    organization_id: togglCommon.organization_id,
    search_term: Property.ShortText({
      displayName: 'Name or Email',
      description: 'The name or email of the user to find.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active Users Only',
      description: 'Return only active users.',
      required: false,
      defaultValue: true,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page.',
      required: false,
    }),
  },
  async run(context) {
    const {
      workspace_id,
      organization_id,
      search_term,
      active,
      page,
      per_page,
    } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: Record<string, string> = {};
    if (search_term) queryParams['search'] = search_term;
    if (active !== undefined) queryParams['active'] = active.toString();
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();

    const searchResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/organizations/${organization_id}/workspaces/${workspace_id}/workspace_users`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams,
    });

    return searchResponse.body;
  },
});
