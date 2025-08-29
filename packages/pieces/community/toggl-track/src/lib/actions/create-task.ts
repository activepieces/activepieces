import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const createTask = createAction({
  auth: togglTrackAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task under a project.',
  props: {
    workspace_id: togglCommon.workspace_id,
    project_id: togglCommon.project_id,
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the new task.',
      required: true,
    }),
    estimated_seconds: Property.Number({
      displayName: 'Estimated Seconds',
      description: 'The estimated time for the task in seconds.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, project_id, name, estimated_seconds } =
      context.propsValue;
    const apiToken = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/projects/${project_id}/tasks`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name,
        estimated_seconds,
      },
    });

    return response.body;
  },
});