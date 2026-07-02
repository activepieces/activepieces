import { isNil, tryCatch } from '@activepieces/core-utils';
import {
  FlowEntityUpdatedEvent,
  FlowRun,
  FlowVersionUpdatedEvent,
  PopulatedFlow,
  UpdateRunProgressRequest,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { flowRunUtils } from '@/features/flow-runs';
import { flowsApi } from '@/features/flows';
import { useAiLockDeltaStream } from '@/hooks/use-ai-lock-delta-stream';

import { useBuilderStateContext } from '../../builder-hooks';

/**
 * Live channel for an open flow builder. While the flow is under an AI lock, every
 * operation the chat agent applies is broadcast to the project room as a full
 * FlowVersion snapshot and swapped into the builder store, so the canvas updates
 * step-by-step instead of waiting for the agent to release the lock.
 *
 * Same shape as `use-table-realtime`: subscribe → gate on the AI lock → idempotent
 * apply (a whole-version snapshot is naturally last-write-wins) → catch-up reconcile.
 * On both edges of the lock we re-fetch an authoritative snapshot; on the rising edge
 * we buffer deltas that arrive during the fetch (so opening the flow mid-run doesn't
 * miss anything) and drain them after. The queue/timer/ready/buffer plumbing is
 * shared with `use-table-realtime` via `useAiLockDeltaStream`.
 */
function useFlowRealtime({ flowId, isAiActive }: UseFlowRealtimeParams) {
  const socket = useSocket();
  const { fitView } = useReactFlow();
  const applyServerVersion = useBuilderStateContext(
    (state) => state.applyServerVersion,
  );
  const reconcileServerVersion = useBuilderStateContext(
    (state) => state.reconcileServerVersion,
  );
  const clearExpiredChangedSteps = useBuilderStateContext(
    (state) => state.clearExpiredChangedSteps,
  );
  const applyServerFlow = useBuilderStateContext(
    (state) => state.applyServerFlow,
  );
  const setRun = useBuilderStateContext((state) => state.setRun);
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  // Keep the latest version in a ref so the run handler can hand it to setRun without
  // re-subscribing the socket on every version delta.
  const flowVersionRef = useRef(flowVersion);
  flowVersionRef.current = flowVersion;
  // The agent's run streams as incremental step deltas; accumulate them across events
  // (same merge the human test path uses) so the run view fills in progressively.
  const lastRunRef = useRef<FlowRun | null>(null);

  const pruneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const followStep = useCallback(
    (stepName: string | undefined) => {
      if (stepName === undefined) {
        return;
      }
      // Defer to the next frame so the just-applied node exists in the React Flow
      // store before we pan to it.
      setTimeout(() => {
        tryCatch(() =>
          fitView({ nodes: [{ id: stepName }], duration: 500, maxZoom: 1.2 }),
        );
      }, FOLLOW_DELAY_MS);
    },
    [fitView],
  );

  const apply = useCallback(
    (event: FlowVersionUpdatedEvent) => {
      applyServerVersion({
        flowVersion: event.flowVersion,
        changedStepNames: event.changedStepNames,
      });
      followStep(event.changedStepNames[event.changedStepNames.length - 1]);
      if (pruneTimerRef.current !== null) {
        clearTimeout(pruneTimerRef.current);
      }
      pruneTimerRef.current = setTimeout(
        clearExpiredChangedSteps,
        PRUNE_DELAY_MS,
      );
    },
    [applyServerVersion, followStep, clearExpiredChangedSteps],
  );

  const fetchSnapshot = useCallback(() => flowsApi.get(flowId), [flowId]);

  const reconcile = useCallback(
    (flow: PopulatedFlow) => {
      // Silent reconcile (no canvas reset): version content + flow-level fields.
      reconcileServerVersion(flow.version);
      applyServerFlow({
        status: flow.status,
        publishedVersionId: flow.publishedVersionId ?? null,
        folderId: flow.folderId ?? null,
      });
    },
    [reconcileServerVersion, applyServerFlow],
  );

  const { enqueueApply, bufferDelta, isAiActiveRef, readyRef } =
    useAiLockDeltaStream<FlowVersionUpdatedEvent, PopulatedFlow>({
      isAiActive,
      staggerMs: STAGGER_MS,
      fetchSnapshot,
      reconcile,
      applyDelta: apply,
    });

  useEffect(() => {
    return () => {
      if (pruneTimerRef.current !== null) {
        clearTimeout(pruneTimerRef.current);
        pruneTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onVersionUpdated = (event: FlowVersionUpdatedEvent) => {
      if (event.flowId !== flowId || !isAiActiveRef.current) {
        return;
      }
      if (!readyRef.current) {
        bufferDelta(event);
        return;
      }
      enqueueApply(event);
    };

    // Flow-level changes (publish / enable-disable / move) — patch the flow entity so the
    // publish badge and status toggle update live. Infrequent, so applied immediately.
    const onFlowUpdated = (event: FlowEntityUpdatedEvent) => {
      if (event.flowId !== flowId || !isAiActiveRef.current) {
        return;
      }
      applyServerFlow({
        status: event.status,
        publishedVersionId: event.publishedVersionId,
        folderId: event.folderId,
      });
    };

    // The agent's test run streams to the project room as step deltas; adopt it into the
    // builder's run view (start → progress → result) so testing is visible live without a
    // refresh. Merge each step into the accumulated run, like the human test path does.
    const onRunProgress = (event: UpdateRunProgressRequest) => {
      if (event.flowRun.flowId !== flowId || !isAiActiveRef.current) {
        return;
      }
      const isSameRun = lastRunRef.current?.id === event.flowRun.id;
      const prevSteps = isSameRun ? lastRunRef.current?.steps ?? {} : {};
      const startTime =
        event.flowRun.startTime ??
        (isSameRun ? lastRunRef.current?.startTime : undefined);
      const steps = isNil(event.step)
        ? prevSteps
        : flowRunUtils.updateRunSteps(
            prevSteps,
            event.step.name,
            event.step.path,
            event.step.output,
          );
      const nextRun = { ...event.flowRun, startTime, steps };
      lastRunRef.current = nextRun;
      setRun(nextRun, flowVersionRef.current);
    };

    socket.on(WebsocketClientEvent.FLOW_VERSION_UPDATED, onVersionUpdated);
    socket.on(WebsocketClientEvent.FLOW_UPDATED, onFlowUpdated);
    socket.on(WebsocketClientEvent.UPDATE_RUN_PROGRESS, onRunProgress);
    return () => {
      socket.off(WebsocketClientEvent.FLOW_VERSION_UPDATED, onVersionUpdated);
      socket.off(WebsocketClientEvent.FLOW_UPDATED, onFlowUpdated);
      socket.off(WebsocketClientEvent.UPDATE_RUN_PROGRESS, onRunProgress);
    };
  }, [
    socket,
    flowId,
    enqueueApply,
    applyServerFlow,
    setRun,
    bufferDelta,
    isAiActiveRef,
    readyRef,
  ]);
}

export { useFlowRealtime };

// Fixed cascade cadence between snapshots in a burst.
const STAGGER_MS = 90;
// Let the just-applied node mount before panning to it.
const FOLLOW_DELAY_MS = 60;
// Prune expired highlights a little after the longest possible highlight lifetime.
const PRUNE_DELAY_MS = 1700;

type UseFlowRealtimeParams = {
  flowId: string;
  isAiActive: boolean;
};
