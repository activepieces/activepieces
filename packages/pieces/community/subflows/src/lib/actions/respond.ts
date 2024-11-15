import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { callableFlowKey, CallableFlowResponse, MOCK_CALLBACK_IN_TEST_FLOW_URL } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const response = createAction({
  name: 'returnResponse',
  displayName: 'Return Response',
  description: 'Return response to the original flow',
  props: {
    response: Property.Json({
      displayName: 'Response',
      required: true,
    }),
  },
  async test(context) {
    return context.propsValue.response;
  },
  async run(context) {
    const callbackUrl = await context.store.get<string>(callableFlowKey(context.run.id), StoreScope.FLOW);
    if (isNil(callbackUrl)) {
      throw new Error(JSON.stringify({
        message: "Please ensure the first action in the flow is Callable Flow"
      }));
    }
    const isNotTestFlow = callbackUrl !== MOCK_CALLBACK_IN_TEST_FLOW_URL;
    if (isNotTestFlow) {

      await httpClient.sendRequest<CallableFlowResponse>({
        method: HttpMethod.POST,
        url: callbackUrl,
        body: {
          data: context.propsValue.response
        },
        retries: 4,
      })
    }

    return context.propsValue.response;
  },
});
