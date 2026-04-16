import {
  createAction,
  DynamicPropsValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ExecutionType, FAIL_PARENT_ON_FAILURE_HEADER, FlowStatus, isNil, MarkdownVariant, PARENT_RUN_ID_HEADER } from '@activepieces/shared';
import { CallableFlowRequest, CallableFlowResponse, subflowsCommon } from '../common';

export const callFlow = createAction({
  name: 'callFlow',
  displayName: 'Call Flow',
  description: 'Triggers another flow (subflow) and optionally waits for its response. The target flow must use the "Callable Flow" trigger. You define the data payload here — the child flow can import it as sample data.',
  props: {
    flow: Property.Dropdown<FlowValue>({
      auth: PieceAuth.None(),
      displayName: 'Flow',
      description: 'Select the subflow to call. It must have a "Callable Flow" trigger.',
      required: true,
      options: async (_, context) => {
        const flows = await subflowsCommon.listFlowsWithSubflowTrigger({
          flowsContext: context.flows,
        });
        return {
          options: flows.map((flow) => ({
            value: {
              externalId: flow.externalId ?? flow.id,
              status: flow.status,
            },
            label: flow.status === FlowStatus.DISABLED
              ? `${flow.version.displayName} (Disabled)`
              : flow.version.displayName,
          })),
        };
      },
      refreshers: [],
      create: {
        label: 'Create new subflow',
        handler: async ({ displayName }, ctx) => {
          const newFlow = await ctx.flows.create({
            displayName,
            triggerPieceName: '@activepieces/piece-subflows',
            triggerName: 'callableFlow',
          });
          return {
            label: newFlow.version.displayName,
            value: { externalId: newFlow.externalId ?? newFlow.id, status: newFlow.status },
          };
        },
      },
    }),
    disabledSubflowWarning: Property.DynamicProperties({
      auth: PieceAuth.None(),
      description: '',
      displayName: '',
      required: false,
      refreshers: ['flow'],
      props: async (propsValue) => {
        const selectedFlow = propsValue['flow'] as unknown as FlowValue | undefined;
        const fields: DynamicPropsValue = {};
        if (!isNil(selectedFlow) && selectedFlow.status === FlowStatus.DISABLED) {
          fields['warning'] = Property.MarkDown({
            value: 'The selected subflow is not enabled. You can still test this step, but you must publish and enable the subflow before you can publish this flow.',
            variant: MarkdownVariant.WARNING,
          });
        }
        return fields;
      },
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
      auth: PieceAuth.None(),
      description: '',
      displayName: '',
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};
        if (mode === 'simple') {
          fields['payload'] = Property.Object({
            displayName: 'Payload',
            required: true,
          });
        }
        else {
          fields['payload'] = Property.Json({
            displayName: 'Payload',
            description: 'Provide the data to be passed to the flow',
            required: true,
          });
        }
        return fields;
      },
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for Response',
      description: 'If enabled, this step pauses until the subflow finishes and returns a response using the "Return Response" action.',
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
    const flow = await subflowsCommon.findFlowByExternalIdOrThrow({
      flowsContext: context.flows,
      externalId: context.propsValue.flow?.externalId,
    });

    let callbackUrl: string | undefined
    if (context.propsValue.waitForResponse) {
      const waitpoint = await context.run.createWaitpoint({
        type: 'WEBHOOK',
      });
      callbackUrl = waitpoint.buildResumeUrl({
        queryParams: {},
      });
      context.run.waitForWaitpoint(waitpoint.id);
    }

    const response = await httpClient.sendRequest<CallableFlowRequest>({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/webhooks/${flow?.id}`,
      headers: {
        'Content-Type': 'application/json',
        [PARENT_RUN_ID_HEADER]: context.run.id,
        [FAIL_PARENT_ON_FAILURE_HEADER]: context.propsValue.waitForResponse ? 'true' : 'false',
      },
      body: {
        data: payload,
        callbackUrl,
      },
    });
    return response.body;
  },
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
      hide: false,
    },
    retryOnFailure: {
      defaultValue: false,
      hide: false,
    }
  }
});

type FlowValue = {
  externalId: string;
  status: FlowStatus;
};
