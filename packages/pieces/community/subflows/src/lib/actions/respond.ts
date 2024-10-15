import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';
import { callableFlowKey, CallableFlowResponse } from '../common';
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
    await httpClient.sendRequest<CallableFlowResponse>({
      method: HttpMethod.POST,
      url: callbackUrl,
      body: {
        data: context.propsValue.response
      },
      retries: 4,
    })
    context.run.stop({
      response: {
        body: context.propsValue.response,
        status: StatusCodes.OK,
      },
    });
    return context.propsValue.response;
  },
});
