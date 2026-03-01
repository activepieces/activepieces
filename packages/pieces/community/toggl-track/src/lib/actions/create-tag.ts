import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const createTag = createAction({
  auth: togglTrackAuth,
  name: 'create_tag',
  displayName: 'Create Tag',
  description: 'Create a new tag in the workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the new tag.',
      required: true,
    }),
  },
  async run(context) {
    const { workspace_id, name } = context.propsValue;
    const apiToken = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/tags`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name,
      },
    });

    return response.body;
  },
});