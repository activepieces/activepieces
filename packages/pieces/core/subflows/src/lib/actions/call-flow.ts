import {
  createAction,
  DynamicPropsValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { ExecutionType, FlowStatus, isNil } from '@activepieces/pieces-framework';
import { CallableFlowResponse, dispatchChild, findFlowByExternalIdOrThrow, listFlowsWithSubflowTrigger } from '../common';

export const callFlow = createAction({
  audience: 'human',
  name: 'callFlow',
  displayName: 'Call Flow',
  description: 'Call a flow that has "Callable Flow" trigger',
  props: {
    flowId: Property.Dropdown<string>({
      auth: PieceAuth.None(),
      displayName: 'Flow',
      description: 'The flow to execute. Published flows with a "Callable Flow" trigger appear here; disabled flows are marked "(inactive)" and cannot be executed until they are enabled.',
      required: true,
      options: async (_, context) => {
        const flows = await listFlowsWithSubflowTrigger({
          flowsContext: context.flows,
        });
        return {
          options: flows.map((flow) => ({
            value: flow.externalId ?? flow.id,
            label:
              flow.status === FlowStatus.ENABLED
                ? flow.version.displayName
                : `${flow.version.displayName} (inactive)`,
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
      auth: PieceAuth.None(),
      description: '',
      displayName: '',
      required: true,
      refreshers: ['flowId', 'mode'],
      props: async (propsValue, context) => {
        const externalId = propsValue['flowId'] as unknown as string;
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};

        if (!isNil(externalId)) {
          const flow = await findFlowByExternalIdOrThrow({
            flowsContext: context.flows,
            externalId,
          });
          const exampleData = flow.version.trigger.settings.input.exampleData as unknown as { sampleData: object };

          if (mode === 'simple') {
            fields['payload'] = Property.Object({
              displayName: 'Payload',
              required: true,
              defaultValue: exampleData.sampleData,
            });
          }
          else{
            fields['payload'] = Property.Json({
              displayName: 'Payload',
              description:
                'Provide the data to be passed to the flow',
              required: true,
              defaultValue: exampleData.sampleData,
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
      externalId: context.propsValue.flowId,
    });

    if (flow.status !== FlowStatus.ENABLED) {
      throw new Error(JSON.stringify({
        message: 'The selected subflow is disabled. Enable it before calling it from a parent flow.',
        externalId: context.propsValue.flowId,
        flowName: flow.version.displayName,
      }));
    }

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

    return dispatchChild({
      apiUrl: context.server.apiUrl,
      flowId: flow.id,
      payload,
      parentRunId: context.run.id,
      failParentOnFailure: context.propsValue.waitForResponse ?? false,
      callbackUrl,
    });
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
