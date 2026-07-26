import {
  createAction,
  ExecutionType,
  FlowStatus,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { DispatchChildrenResult, dispatchChildren, findFlowByExternalIdOrThrow, listFlowsWithSubflowTrigger } from '../common';

const DEFAULT_TIMEOUT_MINUTES = 60;
const MAX_TIMEOUT_MINUTES = 7 * 24 * 60;
const MAX_ITEMS = 1000;
const MAX_REPORTED_FAILURES = 10;

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
      defaultValue: DEFAULT_TIMEOUT_MINUTES,
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
    if (items.length > MAX_ITEMS) {
      throw new Error(JSON.stringify({
        message: `Items must contain at most ${MAX_ITEMS} elements. Split the array across several runs, or dispatch from a child flow.`,
        received: items.length,
      }));
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

    const dispatchAll = (dispatchKeyPrefix?: string) => dispatchChildren({
      apiUrl: context.server.apiUrl,
      flowId: flow.id,
      items,
      parentRunId: context.run.id,
      failParentOnFailure: false,
      dispatchKeyPrefix,
    });

    if (!context.propsValue.waitForAll) {
      const dispatch = await dispatchAll();
      assertAnythingDispatched({ dispatch, requested: items.length });
      return {
        dispatched: dispatch.accepted,
        failedToDispatch: dispatch.failures.length,
        failures: dispatch.failures.slice(0, MAX_REPORTED_FAILURES),
      };
    }

    const timeoutMinutes = context.propsValue.timeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES;
    if (!Number.isInteger(timeoutMinutes) || timeoutMinutes <= 0 || timeoutMinutes > MAX_TIMEOUT_MINUTES) {
      throw new Error(JSON.stringify({
        message: `Timeout must be a whole number of minutes between 1 and ${MAX_TIMEOUT_MINUTES}.`,
        received: context.propsValue.timeoutMinutes,
      }));
    }

    if (items.length === 0) {
      return {
        expected: 0,
        succeeded: 0,
        failed: 0,
        canceled: 0,
        stillRunning: 0,
        failedToDispatch: 0,
        timedOut: false,
      };
    }

    const waitpoint = await context.run.createWaitpoint({ type: 'WEBHOOK', isFanIn: true });
    const dispatch = await dispatchAll(waitpoint.id);
    assertAnythingDispatched({ dispatch, requested: items.length });
    const timeoutAt = new Date(Date.now() + timeoutMinutes * 60_000).toISOString();
    await context.run.sealFanIn({
      expectedChildren: dispatch.accepted,
      failedToDispatch: dispatch.failures.length,
      timeoutAt,
    });
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

function assertAnythingDispatched({ dispatch, requested }: AssertAnythingDispatchedParams): void {
  if (requested === 0 || dispatch.accepted > 0) {
    return;
  }
  throw new Error(JSON.stringify({
    message: 'None of the items could be dispatched to the subflow, so nothing is running and this step can be safely retried.',
    requested,
    failures: dispatch.failures.slice(0, MAX_REPORTED_FAILURES),
  }));
}

type AssertAnythingDispatchedParams = {
  dispatch: DispatchChildrenResult;
  requested: number;
}
