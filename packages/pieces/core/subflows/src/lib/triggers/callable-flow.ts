import {
  createTrigger,
  DynamicPropsValue,
  MarkdownVariant,
  PieceAuth,
  Property,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { callableFlowKey, CallableFlowRequest, MOCK_CALLBACK_IN_TEST_FLOW_URL } from '../common';

export const callableFlow = createTrigger({
  name: 'callableFlow',
  classification: 'READ',
  displayName: 'Callable Flow',
  description: 'Starts when another flow calls this one.',
  aiMetadata: {
    description: 'Fires when another flow invokes this one through the Sub Flows "Call Flow" or "Stream CSV to Subflows" action, making this flow a reusable subroutine; the event represents a single invocation and carries the payload the caller passed in. The Sample Data entered here (key-value in Simple mode or JSON in Advanced mode) defines the payload shape offered to callers, and adding a "Return Response" action lets a waiting caller receive a result.',
  },
  props: {
    info: Property.MarkDown({
      value: 'Other flows run this one with **Call Flow** or **Stream CSV to Subflows**. Add **Return Response** to send data back.',
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
    exampleData: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Sample Data',
      description: 'An example of the data callers send.',
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};
        if (mode === 'simple') {
          fields['sampleData'] = Property.Object({
            displayName: 'Sample Data',
            description: 'Callers see this as the starting payload in Call Flow.',
            required: true,
          });
        } else {
          fields['sampleData'] = Property.Json({
            displayName: 'Sample Data',
            description: 'Callers see this as the starting payload in Call Flow.',
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
