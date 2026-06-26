import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon, Task } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksGetTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Fetch a single task by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch a single task\'s full details (title, notes, due, status, parent, position, links) by its id. Use when you already have a specific task id and want its current state; to find tasks by criteria use Find Tasks instead. Read-only.',
    idempotent: true,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to fetch. Obtain the id from Find Tasks.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const { tasks_list, task_id } = propsValue;

    const response = await httpClient.sendRequest<Task>({
      method: HttpMethod.GET,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasks_list}/tasks/${task_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
    });

    return response.body;
  },
});
