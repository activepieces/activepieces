import {
  createTrigger,
  DynamicPropsValue,
  PieceAuth,
  Property,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { callableFlowKey, CallableFlowRequest, MOCK_CALLBACK_IN_TEST_FLOW_URL, subflowsCommon } from '../common';

export const callableFlow = createTrigger({
  name: 'callableFlow',
  displayName: 'Callable Flow',
  description: 'Makes this flow callable from other flows. Select a parent flow below to preview the data it will send to this flow.',
  props: {
    parentFlow: Property.Dropdown<ParentFlowValue>({
      auth: PieceAuth.None(),
      displayName: 'Select Parent Flow',
      description: 'Choose a parent flow that calls this flow. The payload defined in the parent will be used as sample data for testing.',
      required: false,
      options: async (_, context) => {
        const childFlowId = context.flows.current.id;
        const parents = await subflowsCommon.findParentFlowsCallingChild({
          flowsContext: context.flows,
          childFlowId,
        });
        if (parents.length === 0) {
          return {
            disabled: true,
            placeholder: 'No parent flows found. First, add a "Call Flow" action in another flow that targets this flow.',
            options: [],
          };
        }
        const labelCounts = new Map<string, number>();
        for (const parent of parents) {
          const baseLabel = `${parent.flow.version.displayName} > ${parent.stepDisplayName}`;
          labelCounts.set(baseLabel, (labelCounts.get(baseLabel) ?? 0) + 1);
        }
        const options = parents.map((parent) => {
          const baseLabel = `${parent.flow.version.displayName} > ${parent.stepDisplayName}`;
          const needsDisambiguation = (labelCounts.get(baseLabel) ?? 0) > 1;
          return {
            value: {
              flowId: parent.flow.id,
              flowName: parent.flow.version.displayName,
              stepName: parent.stepName,
              payload: parent.payload,
            },
            label: needsDisambiguation ? `${baseLabel} (${parent.stepName})` : baseLabel,
          };
        });
        return {
          options,
          defaultValue: parents.length === 1 ? options[0].value : undefined,
        };
      },
      refreshers: [],
    }),
    sampleData: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Sample Data from Parent',
      description: 'This is the payload the selected parent flow sends to this flow.',
      required: false,
      refreshers: ['parentFlow'],
      props: async (propsValue, context) => {
        let parentFlow = propsValue['parentFlow'] as unknown as ParentFlowValue | undefined;
        if (!parentFlow) {
          const parents = await subflowsCommon.findParentFlowsCallingChild({
            flowsContext: context.flows,
            childFlowId: context.flows.current.id,
          });
          if (parents.length === 1) {
            parentFlow = {
              flowId: parents[0].flow.id,
              flowName: parents[0].flow.version.displayName,
              stepName: parents[0].stepName,
              payload: parents[0].payload,
            };
          }
        }
        const fields: DynamicPropsValue = {};
        if (parentFlow && typeof parentFlow.payload === 'object' && parentFlow.payload !== null) {
          fields['preview'] = Property.Json({
            displayName: 'Payload Preview',
            required: false,
            defaultValue: parentFlow.payload,
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
    let parentPayload = (context.propsValue.parentFlow as ParentFlowValue | undefined)?.payload;
    if (!parentPayload) {
      const parents = await subflowsCommon.findParentFlowsCallingChild({
        flowsContext: context.flows,
        childFlowId: context.flows.current.id,
      });
      if (parents.length > 0) {
        parentPayload = parents[0].payload;
      }
    }
    const request: CallableFlowRequest = {
      data: parentPayload ?? {},
      callbackUrl: MOCK_CALLBACK_IN_TEST_FLOW_URL,
    };
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
  },
});

type ParentFlowValue = {
  flowId: string;
  flowName: string;
  stepName: string;
  payload: unknown;
};
