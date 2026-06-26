import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksDeleteTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Permanently delete a task by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a task by id. Idempotent — deleting an already-removed task succeeds (converges to absent).',
    idempotent: true,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The ID of the task to delete. Obtain the id from Find Tasks.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const { tasks_list, task_id } = propsValue;

    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasks_list}/tasks/${task_id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: authProp.access_token,
        },
      });
    } catch (error: any) {
      // Treat 404 as success — the task is already absent (idempotent convergence)
      if (error?.response?.status === 404 || error?.status === 404) {
        return { deleted: true, alreadyAbsent: true };
      }
      throw error;
    }

    return { deleted: true, alreadyAbsent: false };
  },
});
