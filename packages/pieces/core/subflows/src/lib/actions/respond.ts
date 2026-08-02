import { DynamicPropsValue, PieceAuth, Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { callableFlowKey, CallableFlowResponse, MOCK_CALLBACK_IN_TEST_FLOW_URL } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';

export const response = createAction({
  audience: 'both',
  name: 'returnResponse',
  displayName: 'Return Response',
  description: 'Return response to the original flow',
  aiMetadata: { description: 'Sends a result payload back to the flow that invoked this one through Call Flow, releasing the caller from its wait; the body is entered as key-value pairs (Simple mode) or as raw JSON (Advanced mode). Use it only inside a flow whose trigger is "Callable Flow", and only when the caller ran with Wait for Response enabled - it silently does nothing when no callback URL was stored for the run. Not idempotent: each call posts a fresh response to the callback URL of the caller.', idempotent: false },
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'Choose Simple for key-value or Advanced for JSON.',
      required: true,
      defaultValue: 'simple',
      options: {
        disabled: false,
        options: [
          {
            label: 'Simple',
            value: 'simple',
          },
          {

            label: 'Advanced',
            value: 'advanced',
          },
        ],
      },
    }),
    response: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Response',
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};
        if (mode === 'simple') {
          fields['response'] = Property.Object({
            displayName: 'Response',
            required: true,
          });
        } else {
          fields['response'] = Property.Json({
            displayName: 'Response',
            required: true,
          });
        }
        return fields;
      },
    }),
  },
  async test(context) {
    return context.propsValue.response['response'];
  },
  async run(context) {
    const response = context.propsValue.response['response'];
    const callbackUrl = await context.store.get<string>(callableFlowKey(context.run.id), StoreScope.FLOW);
    const isNotTestFlow = callbackUrl !== MOCK_CALLBACK_IN_TEST_FLOW_URL;
    if (isNotTestFlow && !isNil(callbackUrl)) {
      await httpClient.sendRequest<CallableFlowResponse>({
        method: HttpMethod.POST,
        url: callbackUrl,
        body: {
          status: 'success',
          data: response
        },
        retries: 10,
      });
    }
    return response;
  },
});