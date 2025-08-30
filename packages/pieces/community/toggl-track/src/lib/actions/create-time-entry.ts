import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const createTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Create a new time entry in a workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    start: Property.DateTime({
      displayName: 'Start Time',
      description: "The start time of the entry in UTC. Defaults to the current time if left blank.",
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (in seconds)',
      description:
        'Duration of the time entry. Use a negative number (e.g., -1) to start a running timer.',
      required: true,
    }),
    project_id: togglCommon.optional_project_id,
    tags: togglCommon.tags,
    billable: Property.Checkbox({
      displayName: 'Billable',
      required: false,
    }),
  },
  async run(context) {
    const {
      workspace_id,
      description,
      start,
      duration,
      project_id,
      tags,
      billable,
    } = context.propsValue;
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
        start: new Date(start).toISOString(),
        duration,
        project_id,
        tags,
        billable,
        created_with: 'Activepieces',
      },
    });

    return response.body;
  },
});