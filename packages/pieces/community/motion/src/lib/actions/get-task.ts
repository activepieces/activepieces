import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/props';

export const getTask = createAction({
  auth: motionAuth,
  name: 'get-task',
  displayName: 'Get Task',
  description: 'Get details of a specific task by ID.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the full details of a single Motion task by its task ID. Use when an agent already has a task ID and needs to read its current fields. Idempotent: a read-only lookup with no side effects.', idempotent: true },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest( {
      method: HttpMethod.GET,
      url:`${BASE_URL}/tasks/${propsValue.taskId}`,
      headers: {
        'X-API-Key': auth.secret_text,
      },
    });

    return response.body;
  },
});
