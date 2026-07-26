import {
  createAction,
  ExecutionType,
  FlowStatus,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { dispatchChild, findFlowByExternalIdOrThrow, listFlowsWithSubflowTrigger } from '../common';

export const dispatchToSubflows = createAction({
  audience: 'human',
  name: 'dispatchToSubflows',
  displayName: 'Fan Out to Subflows',
  description: 'Loop over an array and dispatch each item to a subflow. Optionally wait for all of them to finish before continuing.',
  props: {
    flowId: Property.Dropdown<string>({
      auth: PieceAuth.None(),
      displayName: 'Flow',
      description: 'The flow to dispatch each item to. Published flows with a "Callable Flow" trigger appear here; disabled flows are marked "(inactive)".',
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
    items: Property.Json({
      displayName: 'Items',
      description: 'An array. Each element is sent as the payload of one subflow run.',
      required: true,
    }),
    waitForAll: Property.Checkbox({
      displayName: 'Wait for All',
      description: 'Wait until every dispatched subflow finishes before continuing. When off, dispatch all items and continue immediately.',
      required: false,
      defaultValue: false,
    }),
    timeoutMinutes: Property.Number({
      displayName: 'Timeout (minutes)',
      description: 'When waiting, continue anyway after this many minutes even if some subflows are still running.',
      required: false,
      defaultValue: 60,
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      return context.resumePayload.body;
    }

    const items = context.propsValue.items;
    if (!Array.isArray(items)) {
      throw new Error(JSON.stringify({ message: 'Items must be an array.' }));
    }

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

    const dispatchAll = async () => {
      for (const item of items) {
        await dispatchChild({
          apiUrl: context.server.apiUrl,
          flowId: flow.id,
          payload: item,
          parentRunId: context.run.id,
          failParentOnFailure: false,
        });
      }
    };

    if (!context.propsValue.waitForAll) {
      await dispatchAll();
      return { dispatched: items.length };
    }

    const waitpoint = await context.run.createWaitpoint({ type: 'WEBHOOK', isFanIn: true });
    await dispatchAll();
    const timeoutMinutes = context.propsValue.timeoutMinutes ?? 60;
    const timeoutAt = new Date(Date.now() + timeoutMinutes * 60_000).toISOString();
    await context.run.sealFanIn({ expectedChildren: items.length, timeoutAt });
    context.run.waitForWaitpoint(waitpoint.id);
    return {};
  },
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
      hide: false,
    },
    retryOnFailure: {
      defaultValue: false,
      hide: false,
    },
  },
});
