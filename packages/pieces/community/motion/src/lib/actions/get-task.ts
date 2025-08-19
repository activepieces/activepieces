import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/props';

export const getTask = createAction({
  auth: motionAuth,
  name: 'get-task',
  displayName: 'Get Task',
  description: 'Get details of a specific task by ID.',
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
        'X-API-Key': auth,
      },
    });

    return response.body;
  },
});
