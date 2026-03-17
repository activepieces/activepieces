import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flipandoAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getTask = createAction({
  auth: flipandoAuth,
  name: 'getTask',
  displayName: 'Get Task',
  description:
    'Retrieves the result of a specific Flipando application task by its task ID.',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'ID of the task to be retrieved.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const taskId = context.propsValue.task_id;

    return await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/integrations/tasks/${taskId}`
    );
  },
});
