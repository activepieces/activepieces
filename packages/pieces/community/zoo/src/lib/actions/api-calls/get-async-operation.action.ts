import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAsyncOperationAction = createAction({
  name: 'get_async_operation',
  displayName: 'Get Async Operation',
  description: 'Retrieve details of an asynchronous operation',
  auth: zooAuth,
  // category: 'API Calls',
  props: {
    operationId: Property.ShortText({
      displayName: 'Operation ID',
      required: true,
      description: 'The ID of the async operation to retrieve',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/async/operations/${propsValue.operationId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
