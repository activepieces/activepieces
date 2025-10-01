import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';


export const findTaskAction = createAction({
  auth: wrikeAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Retrieve a task by its ID or lookup fields',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The exact task ID to retrieve',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Search by task title',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Filter by folder ID',
      required: false,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);

    if (context.propsValue.taskId) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${apiUrl}/tasks/${context.propsValue.taskId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      return response.body.data[0];
    }

    const params: any = {};
    if (context.propsValue.title) {
      params.title = context.propsValue.title;
    }
    if (context.propsValue.folderId) {
      params.folderId = context.propsValue.folderId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${apiUrl}/tasks`,
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data;
  },
});