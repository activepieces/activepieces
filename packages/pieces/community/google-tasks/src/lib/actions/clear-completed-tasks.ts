import { createAction } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksClearCompletedTasksAction = createAction({
  auth: googleTasksAuth,
  name: 'clear_completed_tasks',
  displayName: 'Clear Completed Tasks',
  description: 'Hide all completed tasks in a task list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Hide all completed tasks in a task list (they are marked hidden and drop out of the default view, not permanently deleted). Use to tidy a list after a batch of completions. Affects every completed task at once — there is no per-task selection; to remove a single task use Delete Task. Not idempotent — operates on whatever is completed at call time.',
    idempotent: false,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const { tasks_list } = propsValue;

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasks_list}/clear`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
    });

    // tasks.clear returns 204 No Content on success.
    return { cleared: true };
  },
});
