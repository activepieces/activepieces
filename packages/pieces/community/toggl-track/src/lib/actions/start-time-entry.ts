import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const startTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'start_time_entry',
  displayName: 'Start Time Entry',
  description: 'Start a new time entry (live timer).',
  props: {
    workspace_id: togglCommon.workspace_id,
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    project_id: togglCommon.optional_project_id,
    tags: togglCommon.tags,
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the time entry is marked as billable.',
      required: false,
      defaultValue: false,
    }),
    task_id: togglCommon.optional_task_id,
  },
  async run(context) {
    const { workspace_id, description, project_id, tags, billable, task_id } =
      context.propsValue;
    const apiToken = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/time_entries`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        workspace_id: Number(workspace_id),
        description,
        start: new Date().toISOString(),
        duration: -1,
        created_with: 'Activepieces',
        billable,
        ...(project_id && { project_id }),
        ...(task_id && { task_id }),
        ...(tags && { tags }),
      },
    });

    return response.body;
  },
});
