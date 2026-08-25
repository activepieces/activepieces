import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getTask = createAction({
  auth: fragmentAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Retrieves details of a specific task.',
  audience: 'both',
  aiMetadata: { description: 'Fetches the full details of a single Fragment task by its unique task UID. Use when you already have a task identifier and need its current data. Read-only and idempotent.', idempotent: true },
  props: {
    task_uid: Property.ShortText({
      displayName: 'Task UID',
      description: 'The unique identifier of the task to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const response = await fragmentClient.makeRequest(
      HttpMethod.GET,
      `/tasks/${context.propsValue.task_uid}`,
      context.auth
    );

    return response;
  },
});

