import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL } from '../common';
import { skyvernAuth } from '../common/auth';

export const findWorkflowAction = createAction({
  auth: skyvernAuth,
  name: 'find-workflow',
  displayName: 'Find Workflow',
  description: 'Finds workflow based on title.',
  props: {
    title: Property.ShortText({
      displayName: 'Workflow Title',
      required: true,
    }),
  },
  async run(context) {
    const { title } = context.propsValue;
    const apiKey = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: BASE_URL + '/workflows',
      headers: {
        'x-api-key': apiKey,
      },
      queryParams: {
        title,
      },
    });

    return response.body;
  },
});
