import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const createTaskAction = createAction({
  auth: clockifyAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      required: true,
    }),
    taskName: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
  },
  async run(context) {
    const { workspaceId, projectId, taskName } = context.propsValue;
    const apiKey = context.auth as string;

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      { name: taskName }
    );
  },
});
