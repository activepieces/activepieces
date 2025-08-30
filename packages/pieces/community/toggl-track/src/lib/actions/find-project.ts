import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const findProject = createAction({
  auth: togglTrackAuth,
  name: 'find_project',
  displayName: 'Find Project',
  description: 'Find a project in a workspace by its name.',
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
        displayName: 'Project Name',
        description: 'The name of the project to find (case-insensitive).',
        required: true,
    }),
  },
  async run(context) {
    const { workspace_id, name } = context.propsValue;
    const apiToken = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/projects`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams: {
        name: name,
      }
    });

    
    return response.body;
  },
});