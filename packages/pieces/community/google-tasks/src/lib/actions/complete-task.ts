import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon, Task } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksCompleteTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'complete_task',
  displayName: 'Mark Task Complete',
  description: 'Mark an existing task as completed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Mark an existing task as completed (by task id). Idempotent — re-completing a done task is a no-op. Use Update Task to reopen or edit other fields.',
    idempotent: true,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The ID of the task to mark as completed. Obtain the id from Find Tasks.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const { tasks_list, task_id } = propsValue;

    const response = await httpClient.sendRequest<Task>({
      method: HttpMethod.PATCH,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasks_list}/tasks/${task_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
      body: { status: 'completed' },
    });

    return response.body;
  },
});
