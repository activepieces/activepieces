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
      description: 'The name of the project to find.',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Project Status',
      description: 'Return active, inactive, or both types of projects.',
      required: false,
      defaultValue: 'true',
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    billable: Property.Checkbox({
      displayName: 'Billable Only',
      description: 'Return only billable projects.',
      required: false,
    }),
    only_me: Property.Checkbox({
      displayName: 'My Projects Only',
      description: 'Get only projects assigned to the current user.',
      required: false,
      defaultValue: false,
    }),
    only_templates: Property.Checkbox({
      displayName: 'Templates Only',
      description: 'Return only template projects.',
      required: false,
      defaultValue: false,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page (max 200).',
      required: false,
    }),
  },
  async run(context) {
    const {
      workspace_id,
      name,
      active,
      billable,
      only_me,
      only_templates,
      page,
      per_page,
    } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: Record<string, string> = {};
    if (name) queryParams['name'] = name;
    if (active !== undefined) queryParams['active'] = active;
    if (billable !== undefined) queryParams['billable'] = billable.toString();
    if (only_me !== undefined) queryParams['only_me'] = only_me.toString();
    if (only_templates !== undefined)
      queryParams['only_templates'] = only_templates.toString();
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/projects`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams,
    });

    return response.body;
  },
});
