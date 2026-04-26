import {
  createAction,
  DynamicPropsValue,
  PieceAuth,
  PropertyContext,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { ExecutionType, FAIL_PARENT_ON_FAILURE_HEADER, isNil, PARENT_RUN_ID_HEADER, SampleDataFileType } from '@activepieces/shared';
import { CallableFlowRequest, CallableFlowResponse, findFlowByExternalIdOrThrow, listEnabledFlowsWithSubflowTrigger } from '../common';

export const callFlow = createAction({
  name: 'callFlow',
  displayName: 'Call Another Flow',
  description: 'Run another flow and (optionally) wait for its response.',
  props: {
    flow: Property.Dropdown<FlowValue>({
      auth: PieceAuth.None(),
      displayName: 'Flow to call',
      description: 'Only flows with the "When Called by Another Flow" trigger appear here.',
      required: true,
      options: async (_, context) => {
        const flows = await listEnabledFlowsWithSubflowTrigger({
          flowsContext: context.flows,
        });
        return {
          options: flows.map((flow) => ({
            value: {
              externalId: flow.externalId ?? flow.id,
            },
            label: flow.version.displayName,
          })),
        };
      },
      refreshers: [],
    }),
    mode: Property.StaticDropdown({
      displayName: 'Input data format',
      required: true,
      description: 'Use "Fields" to define named keys, or "JSON" to pass a free-form object.',
      defaultValue: 'simple',
      options: {
        disabled: false,
        options: [
          {
            label: 'Fields',
            value: 'simple',
          },
          {
            label: 'JSON',
            value: 'advanced',
          },
        ],
      },
    }),
    flowProps: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Input Data',
      description: 'The data to send to the called flow. Pre-filled from the sample input saved on that flow.',
      required: true,
      refreshers: ['flow', 'mode'],
      props: async (propsValue, context) => {
        const castedFlowValue = propsValue['flow'] as unknown as FlowValue | undefined;
        const mode = propsValue['mode'] as unknown as string;
        const fields: DynamicPropsValue = {};

        if (isNil(castedFlowValue)) {
          return fields;
        }
        const defaultPayload = await resolveDefaultPayload({
          externalId: castedFlowValue.externalId,
          context,
        });
        if (mode === 'simple') {
          fields['payload'] = Property.Object({
            displayName: 'Input Data',
            required: true,
            defaultValue: defaultPayload,
          });
        }
        else {
          fields['payload'] = Property.Json({
            displayName: 'Input Data',
            description: 'The data to send to the called flow. Pre-filled from the sample input saved on that flow.',
            required: true,
            defaultValue: defaultPayload,
          });
        }
        return fields;
      },
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for Response',
      description: 'If on, this step pauses until the called flow finishes and returns a response. If off, fires and forgets.',
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
      defaultValue:false,
      hide:false,
    },
    retryOnFailure: {
      defaultValue:false,
      hide:false,
    }
  }
});

async function resolveDefaultPayload({
  externalId,
  context,
}: {
  externalId: string;
  context: PropertyContext;
}): Promise<Record<string, unknown>> {
  let flow;
  try {
    flow = await findFlowByExternalIdOrThrow({
      flowsContext: context.flows,
      externalId,
    });
  }
  catch {
    return {};
  }
  const triggerSampleDataFileId = flow.version.trigger.settings.sampleData?.sampleDataFileId;
  if (isNil(triggerSampleDataFileId)) {
    return {};
  }
  const fetched = await fetchTriggerSampleData({
    context,
    flowId: flow.id,
    flowVersionId: flow.version.id,
    stepName: flow.version.trigger.name,
  });
  return toRecordOrUndefined(fetched) ?? {};
}

function toRecordOrUndefined(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

async function fetchTriggerSampleData({
  context,
  flowId,
  flowVersionId,
  stepName,
}: {
  context: PropertyContext;
  flowId: string;
  flowVersionId: string;
  stepName: string;
}): Promise<unknown> {
  try {
    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/sample-data`,
      queryParams: {
        flowId,
        flowVersionId,
        stepName,
        projectId: context.project.id,
        type: SampleDataFileType.OUTPUT,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });
    return response.body;
  }
  catch {
    return undefined;
  }
}

type FlowValue = {
  externalId: string;
};
