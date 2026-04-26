import { DynamicPropsValue, PieceAuth, Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { callableFlowKey, CallableFlowResponse, MOCK_CALLBACK_IN_TEST_FLOW_URL } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const response = createAction({
  name: 'returnResponse',
  displayName: 'Return Response to Caller',
  description: 'Sends data back to the flow that called this one.',
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Response format',
      description: 'Use "Fields" to define named keys, or "JSON" to pass a free-form object.',
      required: true,
      defaultValue: 'simple',
      options: {
        disabled: false,
        options: [
          {
            label: 'Fields',
            value: 'simple',
          },
          {

            label: 'JSON',
            value: 'advanced',
          },
        ],
      },
    }),
    response: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Response',
      description: 'The data to return to the calling flow. Only used when the caller has "Wait for Response" enabled.',
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
