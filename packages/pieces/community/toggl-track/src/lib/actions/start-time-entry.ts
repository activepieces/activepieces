import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const startTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'start_time_entry',
  displayName: 'Start Time Entry',
  description: 'Start a new time entry (live timer).',
  audience: 'both',
  aiMetadata: { description: 'Starts a live running timer in a Toggl Track workspace, beginning now with an open-ended duration; optionally links project, task, tags, and billable flag. Use to begin tracking time in real time (use Stop Time Entry to end it); prefer Create Time Entry to log a completed entry with an explicit start/stop. Not idempotent: each call starts a new running entry.', idempotent: false },
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
