import {
  createAction,
  DynamicProp,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ExecutionType, FlowStatus, isNil, PauseType, TriggerType } from '@activepieces/shared';
import { CallableFlowRequest, CallableFlowResponse } from '../common';

type FlowValue = {
  id: string;
  exampleData: unknown;
};

export const callFlow = createAction({
  name: 'callFlow',
  displayName: 'Call Flow',
  description: 'Call another sub flow',
  props: {
    flow: Property.Dropdown<FlowValue>({
      displayName: 'Flow',
      description: 'The flow to execute',
      required: true,
      options: async (_, context) => {
        const allFlows = (await context.flows.list()).data;
        const flows = allFlows.filter(
          (flow) =>
            flow.status === FlowStatus.ENABLED &&
            flow.version.trigger.type === TriggerType.PIECE &&
            flow.version.trigger.settings.pieceName ==
            '@activepieces/piece-subflows'
        );
        return {
          options: flows.map((flow) => ({
            value: {
              id: flow.id,
              exampleData: flow.version.trigger.settings.input.exampleData,
            },
            label: flow.version.displayName,
          })),
        };
      },
      refreshers: [],
    }),
    flowProps: Property.DynamicProperties({
      description: '',
      displayName: '',
      required: true,
      refreshers: ['flow'],
      props: async (propsValue) => {
        const props: Record<string, DynamicProp> = {};
        const castedFlowValue = propsValue['flow'] as unknown as FlowValue;
        if (!isNil(castedFlowValue)) {
          props['payload'] = Property.Json({
            displayName: 'Payload',
            description:
              'Provide the data to be passed to the flow',
            required: true,
            defaultValue: castedFlowValue.exampleData as unknown as object,
          });
        }
        return props;
      },
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for Response',
      required: false,
      defaultValue: false,
    }),
    testingProps: Property.DynamicProperties({
      description: '',
      displayName: '',
      required: true,
      refreshers: ['waitForResponse'],
      props: async (propsValue) => {
        const props: Record<string, DynamicProp> = {};
        if (!propsValue['waitForResponse']) {
          return props;
        }
        props['data'] = Property.Json({
          displayName: 'Example Response (For Testing)',
          required: true,
          description: 'This data will be returned when testing this step, and is necessary to proceed with building the flow'
        })
        return props;
      }
    })
  },
  async test(context) {
    return {
      data: context.propsValue?.testingProps?.['data'] ?? {}
    };
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      const response = context.resumePayload.body as CallableFlowResponse;
      return {
        data: response.data
      }
    }
    const payload = context.propsValue.flowProps['payload'];
    const response = await httpClient.sendRequest<CallableFlowRequest>({
      method: HttpMethod.POST,
      url: `${context.serverUrl}v1/webhooks/${context.propsValue.flow?.id}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        data: payload,
        callbackUrl: context.generateResumeUrl({
          queryParams: {}
        }),
      },
    });
    if (context.propsValue.waitForResponse) {
      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        }
      })
    }
    return response.body;
  },
});
