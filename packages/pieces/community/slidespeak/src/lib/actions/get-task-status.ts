import { slidespeakAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL } from '../common/constants';

export const getTaskStatusAction = createAction({
  auth: slidespeakAuth,
  name: 'get-task-status',
  displayName: 'Get Task Status',
  description: 'Gets status of task by id.',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
  },
  async run(context) {
    const { taskId } = context.propsValue;
    const apiKey = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: BASE_URL + `/task_status/${taskId}`,
      headers: {
        'X-API-key': apiKey,
      },
    });

    return response.body;
  },
});
