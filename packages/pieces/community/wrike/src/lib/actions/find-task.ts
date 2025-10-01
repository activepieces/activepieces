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
    withInvitations: Property.Checkbox({
      displayName: 'Include Invitations',
      description: 'Whether to include invitations in the response',  
      required: false,
    }),
    plainTextCustomFields: Property.Checkbox({
      displayName: 'Plain Text Custom Fields',
      description: 'Whether to return custom fields as plain text',
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
    // if (context.propsValue.includeInvitations) {
    //   params.title = context.propsValue.includeInvitations;
    // }
    // if (context.propsValue.plainTextCustomFields) {
    //   params.folderId = context.propsValue.plainTextCustomFields;
    // }

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