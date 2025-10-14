import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const findTask = createAction({
  auth: togglTrackAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Find a task by name and status.',
  props: {
    workspace_id: togglCommon.workspace_id,
    search: Property.ShortText({
      displayName: 'Task Name',
      description: 'Search by task name.',
      required: false,
    }),
    project_id: Property.Number({
      displayName: 'Project ID',
      description: 'Filter by project ID.',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by active state.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page (default 50).',
      required: false,
    }),
    sort_field: Property.StaticDropdown({
      displayName: 'Sort Field',
      description: 'Field used for sorting.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Created At', value: 'created_at' },
        ],
      },
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'ASC' },
          { label: 'Descending', value: 'DESC' },
        ],
      },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Smallest boundary date (YYYY-MM-DD).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Biggest boundary date (YYYY-MM-DD).',
      required: false,
    }),
  },
  async run(context) {
    const {
      workspace_id,
      search,
      project_id,
      active,
      page,
      per_page,
      sort_field,
      sort_order,
      start_date,
      end_date,
    } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: QueryParams = {};
    if (search) queryParams['search'] = search;
    if (project_id) queryParams['pid'] = project_id.toString();
    if (active) queryParams['active'] = active;
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();
    if (sort_field) queryParams['sort_field'] = sort_field;
    if (sort_order) queryParams['sort_order'] = sort_order;
    if (start_date) queryParams['start_date'] = start_date;
    if (end_date) queryParams['end_date'] = end_date;

    const response = await httpClient.sendRequest<{ data: unknown[] }>({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/tasks`,
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
