import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteTask = createAction({
  auth: fragmentAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes an existing task.',
  props: {
    task_uid: Property.ShortText({
      displayName: 'Task UID',
      description: 'The unique identifier of the task to delete',
      required: true,
    }),
  },
  async run(context) {
    const response = await fragmentClient.makeRequest(
      HttpMethod.DELETE,
      `/tasks/${context.propsValue.task_uid}`,
      context.auth
    );

    return response;
  },
});

