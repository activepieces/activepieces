import {
  createTrigger,
  DynamicPropsValue,
  Property,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { callableFlowKey, CallableFlowRequest, MOCK_CALLBACK_IN_TEST_FLOW_URL } from '../common';

export const callableFlow = createTrigger({
  name: 'callableFlow',
  displayName: 'Callable Flow',
  description: 'Waiting to be triggered from another flow',
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      required: true,
      description: 'Choose Simple for key-value or Advanced for JSON.',
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
    exampleData: Property.DynamicProperties({
      displayName: 'Sample Data',
      description: 'The schema to be passed to the flow',
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};
        if (mode === 'simple') {
          fields['sampleData'] = Property.Object({
            displayName: 'Sample Data',
            required: true,
          });
        } else {
          fields['sampleData'] = Property.Json({
            displayName: 'Sample Data',
            required: true,
          });
        }
        return fields;
      },
    }),
  },
  sampleData: null,
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // ignore
  },
  async onDisable() {
    // ignore
  },
  async test(context) {
    const request: CallableFlowRequest = {
      data: context.propsValue.exampleData['sampleData'],
      callbackUrl: MOCK_CALLBACK_IN_TEST_FLOW_URL
    }
    return [request];
  },
  async run(context) {
    return [context.payload.body];
  },
  async onStart(context) {
    const request = context.payload as CallableFlowRequest;
    if (request.callbackUrl) {
      await context.store.put(callableFlowKey(context.run.id), request.callbackUrl, StoreScope.FLOW);
    }
  }
});
