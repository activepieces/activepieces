import {
  createAction,
  DynamicPropsValue,
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
    flowProps: Property.DynamicProperties({
      description: '',
      displayName: '',
      required: true,
      refreshers: ['flow', 'mode'],
      props: async (propsValue) => {
        const castedFlowValue = propsValue['flow'] as unknown as FlowValue;
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};


        if (!isNil(castedFlowValue)) {
          if (mode === 'simple') {
            fields['payload'] = Property.Object({
              displayName: 'Payload',
              required: true,
              defaultValue: (castedFlowValue.exampleData as unknown as { sampleData: object }).sampleData,
            });
          }
          else{
            fields['payload'] = Property.Json({
              displayName: 'Payload',
              description:
                'Provide the data to be passed to the flow',
              required: true,
              defaultValue: (castedFlowValue.exampleData as unknown as { sampleData: object }).sampleData,
            });
          }
        }
        return fields;
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
      refreshers: ['waitForResponse', 'mode'],
      props: async (propsValue) => {
        const fields: DynamicPropsValue = {};
        if (!propsValue['waitForResponse']) {
          return fields;
        }

        const mode = propsValue['mode'] as unknown as string;

        if (mode === 'simple') {
            fields['data'] = Property.Object({
            displayName: 'Example Response (For Testing)',
            required: true,
            description: 'This data will be returned when testing this step, and is necessary to proceed with building the flow',
            defaultValue: {},
          });
        } else {
          fields['data'] = Property.Json({
            displayName: 'Example Response (For Testing)',
            required: true,
            description: 'This data will be returned when testing this step, and is necessary to proceed with building the flow',
            defaultValue: {},
          });
        }

        return fields;
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
        callbackUrl: context.propsValue.waitForResponse ?  context.generateResumeUrl({
          queryParams: {}
        }) : undefined,
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
