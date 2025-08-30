import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const createProject = createAction({
  auth: togglTrackAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project in a workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the new project.',
      required: true,
    }),
    client_id: togglCommon.client_id,
    is_private: Property.Checkbox({
      displayName: 'Private',
      description: 'Whether the project is private or not.',
      required: false,
      defaultValue: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the project is billable or not. (Premium feature)',
      required: false,
      defaultValue: false,
    }),
    template: Property.Checkbox({
      displayName: 'Is Template',
      description:
        'Whether the project is a template. (Premium feature)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { workspace_id, name, client_id, is_private, billable, template } =
      context.propsValue;
    const apiToken = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/projects`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name,
        client_id,
        is_private,
        billable,
        template,
      },
    });

    return response.body;
  },
});