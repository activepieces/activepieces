import { DynamicPropsValue, MarkdownVariant, PieceAuth, Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { callableFlowKey, deliverSubflowResponse, MOCK_CALLBACK_IN_TEST_FLOW_URL } from '../common';
import { isNil } from '@activepieces/pieces-framework';

export const response = createAction({
  audience: 'both',
  name: 'returnResponse',
  classification: 'WRITE',
  displayName: 'Return Response',
  description: 'Send data back to the flow that called this one.',
  aiMetadata: { description: 'Sends a result payload back to the flow that invoked this one through Call Flow, releasing the caller from its wait; the body is entered as key-value pairs (Simple mode) or as raw JSON (Advanced mode). Use it only inside a flow whose trigger is "Callable Flow", and only when the caller ran with Wait for Response enabled - it silently does nothing when no callback URL was stored for the run. Not idempotent: each call posts a fresh response to the callback URL of the caller.', idempotent: false },
  props: {
    info: Property.MarkDown({
      value: 'Sends this data back to the calling flow. It only arrives if the caller has **Wait for Response** on.',
      variant: MarkdownVariant.INFO,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Data Format',
      required: true,
      description: 'How you enter the data: key-value pairs or raw JSON.',
      defaultValue: 'simple',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Simple',
            value: 'simple',
            description: 'Key-value',
            icon: 'sliders',
          },
          {
            label: 'Advanced',
            value: 'advanced',
            description: 'Raw JSON',
            icon: 'code',
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
            description: 'The data the calling flow receives.',
            required: true,
          });
        } else {
          fields['response'] = Property.Json({
            displayName: 'Response',
            description: 'The data the calling flow receives.',
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
      await deliverSubflowResponse({ callbackUrl, response });
    }
    return response;
  },
});