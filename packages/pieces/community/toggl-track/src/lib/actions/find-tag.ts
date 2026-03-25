import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const findTag = createAction({
  auth: togglTrackAuth,
  name: 'find_tag',
  displayName: 'Find Tag',
  description: 'Find a tag by name in a workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    search: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Search by tag name.',
      required: false,
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
    const { workspace_id, search, page, per_page } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: QueryParams = {};
    if (search) queryParams['search'] = search;
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/tags`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams: queryParams,
    });

    return response.body;
  },
});
