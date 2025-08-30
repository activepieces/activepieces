import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const findTask = createAction({
  auth: togglTrackAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Find a task by name and status within a workspace or a specific project.',
  props: {
    workspace_id: togglCommon.workspace_id,
    search_term: Property.ShortText({
        displayName: 'Task Name',
        description: 'The name of the task to find (case-insensitive).',
        required: true,
    }),
    project_id: togglCommon.optional_project_id,
    status: Property.StaticDropdown({
        displayName: 'Status',
        description: 'Filter tasks by their status.',
        required: false,
        options: {
            options: [
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
                { label: 'Both', value: 'both' },
            ]
        }
    })
  },
  async run(context) {
    const { workspace_id, search_term, project_id, status } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: QueryParams = { search: search_term };
    if (project_id) {
        
        queryParams['pid'] = (project_id as number).toString();
    }
    if (status) {
        queryParams['active'] = status as string;
    }

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

    
    return response.body.data;
  },
});