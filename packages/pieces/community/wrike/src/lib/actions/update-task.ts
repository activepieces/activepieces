import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';


export const updateTaskAction = createAction({
  auth: wrikeAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Update fields of an existing task',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to update',
      required: true,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const body: any = {};

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${apiUrl}/tasks/${context.propsValue.taskId}`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data[0];
  },
});