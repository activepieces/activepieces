import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAsyncOperationAction = createAction({
  name: 'get_async_operation',
  displayName: 'Get Async Operation',
  description: 'Retrieve details of an asynchronous operation',
  audience: 'both',
  aiMetadata: { description: 'Fetch the current state of a long-running async operation by its operation ID, including status and result when complete. Use to poll the outcome of asynchronous jobs such as conversions or model generation. Read-only; safe to call repeatedly while polling.', idempotent: true },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
