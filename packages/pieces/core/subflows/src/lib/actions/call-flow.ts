import {
  createAction,
  DynamicPropsValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { ExecutionType, isNil } from '@activepieces/pieces-framework';
import { CallableFlowResponse, dispatchToSubflow, findEnabledSubflowOrThrow, findFlowByExternalIdOrThrow, subflowDropdown } from '../common';

export const callFlow = createAction({
  audience: 'both',
  name: 'callFlow',
  classification: 'WRITE',
  displayName: 'Call Flow',
  description: 'Run another flow that starts with the Callable Flow trigger.',
  aiMetadata: { description: 'Dispatches a run of another flow in this project that starts with a "Callable Flow" trigger, passing a payload entered as key-value pairs or raw JSON, and can optionally wait for that subflow to send back a "Return Response". Pick it to reuse a flow as a subroutine; prefer Stream CSV to Subflows for large CSV input. The target flow must be published and enabled, and when Wait for Response is on, a subflow failure also fails this run; not idempotent, since every call starts a new subflow run.', idempotent: false },
  props: {
    flowId: subflowDropdown({
      displayName: 'Flow',
      description: 'Flows that start with Callable Flow. Enable inactive ones first.',
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
              description: 'The data the subflow receives.',
              required: true,
              defaultValue: exampleData.sampleData,
            });
          }
          else{
            fields['payload'] = Property.Json({
              displayName: 'Payload',
              description: 'The data the subflow receives.',
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
      description: 'Wait for the subflow to return a response. Fails if the subflow fails.',
      required: false,
      defaultValue: false,
    }),
  },
  propertyGroups: [
    { key: 'flow', display: 'section', label: 'Flow to Call', icon: 'send', props: ['flowId', 'waitForResponse'] },
    { key: 'payload', display: 'section', label: 'Data to Send', icon: 'code', props: ['mode', 'flowProps'] },
  ],
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
    const flow = await findEnabledSubflowOrThrow({
      flowsContext: context.flows,
      externalId: context.propsValue.flowId,
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

    return await dispatchToSubflow({
      apiUrl: context.server.apiUrl,
      flowId: flow.id,
      parentRunId: context.run.id,
      failParentOnFailure: context.propsValue.waitForResponse ?? false,
      data: payload,
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
