import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ExecutionType, FAIL_PARENT_ON_FAILURE_HEADER, isNil, PauseType, PARENT_RUN_ID_HEADER } from '@activepieces/shared';
import { CallableFlowRequest, CallableFlowResponse, findFlowByExternalIdOrThrow, listEnabledFlowsWithSubflowTrigger } from '../common';

type FlowValue = {
  externalId: string;
  exampleData: unknown;
};

export const callFlow = createAction({
  name: 'callFlow',
  displayName: 'Call Flow',
  description: 'Call a flow that has "Callable Flow" trigger',
  props: {
    flow: Property.Dropdown<FlowValue>({
      displayName: 'Flow',
      description: 'The flow to execute',
      required: true,
      options: async (_, context) => {
        const flows = await listEnabledFlowsWithSubflowTrigger({
          flowsContext: context.flows,
        });
        return {
          options: flows.map((flow) => ({
            value: {
              externalId: flow.externalId ?? flow.id,
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
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      const response = context.resumePayload.body as CallableFlowResponse;
      const shouldFailParentRun = response.status === 'error' && context.propsValue.waitForResponse
      if (shouldFailParentRun) {
        throw new Error(JSON.stringify(response.data, null, 2))
      }
      return {
        status: response.status,
        data: response.data
      }
    }
    const payload = context.propsValue.flowProps['payload'];
    const flow = await findFlowByExternalIdOrThrow({
      flowsContext: context.flows,
      externalId: context.propsValue.flow?.externalId,
    });

    const response = await httpClient.sendRequest<CallableFlowRequest>({
      method: HttpMethod.POST,
      url: `${context.serverUrl}v1/webhooks/${flow?.id}`,
      headers: {
        'Content-Type': 'application/json',
        [PARENT_RUN_ID_HEADER]: context.run.id,
        [FAIL_PARENT_ON_FAILURE_HEADER]: context.propsValue.waitForResponse ? 'true' : 'false',
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
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue:false,
      hide:false,
    },
    retryOnFailure: {
      defaultValue:false,
      hide:false,
    }
  }
});
