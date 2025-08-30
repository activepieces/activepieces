import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const findTag = createAction({
  auth: togglTrackAuth,
  name: 'find_tag',
  displayName: 'Find Tag',
  description: 'Find a tag by name in a workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
        displayName: 'Tag Name',
        description: 'The name of the tag to find.',
        required: true,
    }),
  },
  async run(context) {
    const { workspace_id, name } = context.propsValue;
    const apiToken = context.auth;

    
    const queryParams: QueryParams = {
        search: name,
    };

    const response = await httpClient.sendRequest<[{ id: number, name: string }]>({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/tags`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams: queryParams
    });

    
    const matchingTags = response.body.filter(tag => tag.name.toLowerCase() === name.toLowerCase());

    return matchingTags;
  },
});