import { isNil } from '@activepieces/core-utils';
import {
  FlowRunStatus,
  FlowTrigger,
  Step,
  StepOutput,
  flowStructureUtil,
} from '@activepieces/shared';
import { useMemo } from 'react';

import { flowRunQueries, flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../builder-hooks';

import { BatchChild, BatchChildState, batchUtils } from './batch-utils';

export const useBatchStepRun = (batchStepName: string | null) => {
  const [run, loopsIndexes, batchIndex] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    isNil(batchStepName) ? 0 : state.batchesIndexes[batchStepName] ?? 0,
  ]);
  const output = useMemo(() => {
    if (isNil(batchStepName) || isNil(run?.steps)) {
      return null;
    }
    const stepOutput = flowRunUtils.extractStepOutput(
      batchStepName,
      loopsIndexes,
      run.steps,
    );
    return batchUtils.parseStepOutput(stepOutput?.output);
  }, [run, batchStepName, loopsIndexes]);
  const barrierId = output?.barrierId ?? null;
  const batchCount = isNil(output) ? 0 : batchUtils.batchCount(output);
  const selectedDispatchIndex = Math.min(
    batchIndex,
    Math.max(batchCount - 1, 0),
  );

  const {
    data: selectedPage,
    isLoading: isSelectedChildLoading,
    isError: isSelectedChildError,
    refetch: refetchSelectedChild,
  } = flowRunQueries.useBatchChildByIndex({
    barrierId,
    dispatchIndex: selectedDispatchIndex,
    enabled: batchCount > 0,
    hasBatchSummary: batchUtils.hasBatchSummary(output),
  });

  const selectedChild = toBatchChildren(selectedPage?.data)[0] ?? null;

  return {
    output,
    batchCount,
    selectedDispatchIndex,
    selectedChild,
    isSelectedChildLoading,
    selectedChildRequestFailed: isSelectedChildError && isNil(selectedPage),
    refetchSelectedChild,
  };
};

export const useBatchLogs = (stepName: string | undefined): BatchLogs => {
  const trigger = useBuilderStateContext((state) => state.flowVersion.trigger);
  const batchStepName = useMemo(
    () =>
      isNil(stepName)
        ? null
        : enclosingBatchStep({ stepName, trigger })?.name ?? null,
    [trigger, stepName],
  );
  const {
    output,
    selectedDispatchIndex,
    selectedChild,
    isSelectedChildLoading,
    selectedChildRequestFailed,
    refetchSelectedChild,
  } = useBatchStepRun(batchStepName);
  const {
    data: childRun,
    isLoading: isChildRunLoading,
    isError: isChildRunError,
    refetch: refetchChildRun,
  } = flowRunQueries.useFlowRun(selectedChild?.id ?? null);

  if (isNil(batchStepName) || isNil(output)) {
    return NOT_IN_A_BATCH;
  }
  if (selectedChildRequestFailed) {
    return { kind: 'error', childRunId: null, retry: refetchSelectedChild };
  }
  if (!isNil(selectedChild) && isChildRunError && isNil(childRun)) {
    return {
      kind: 'error',
      childRunId: selectedChild.id,
      retry: refetchChildRun,
    };
  }
  if (isSelectedChildLoading || (!isNil(selectedChild) && isChildRunLoading)) {
    return { kind: 'loading', childRunId: selectedChild?.id ?? null };
  }
  const steps = childRun?.steps;
  if (!isNil(steps) && Object.keys(steps).length > 0) {
    return { kind: 'steps', steps, childRunId: selectedChild?.id ?? null };
  }
  return {
    kind: batchUtils.missingLogsReason({
      output,
      dispatchIndex: selectedDispatchIndex,
      child: selectedChild,
    }),
    childRunId: selectedChild?.id ?? null,
  };
};

export const useStepOutputInRun = (stepName: string | undefined) => {
  const [run, loopsIndexes] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
  ]);
  const batchLogs = useBatchLogs(stepName);
  const steps = batchLogs.kind === 'steps' ? batchLogs.steps : run?.steps;
  const stepOutput = useMemo(() => {
    if (isNil(stepName) || isNil(steps)) {
      return undefined;
    }
    return flowRunUtils.extractStepOutput(stepName, loopsIndexes, steps);
  }, [steps, stepName, loopsIndexes]);
  return { stepOutput, batchLogs, steps };
};

export function enclosingBatchStep({
  stepName,
  trigger,
}: {
  stepName: string;
  trigger: FlowTrigger;
}): Step | null {
  return (
    flowStructureUtil
      .getBatchSteps(trigger)
      .find((step) => flowStructureUtil.isChildOf(step, stepName)) ?? null
  );
}

function toBatchChildren(
  runs:
    | { id: string; status: FlowRunStatus; dispatchIndex?: number | null }[]
    | undefined,
): BatchChild[] {
  return (runs ?? []).flatMap((run) =>
    isNil(run.dispatchIndex)
      ? []
      : [{ id: run.id, status: run.status, dispatchIndex: run.dispatchIndex }],
  );
}

const NOT_IN_A_BATCH = { kind: 'notInABatch', childRunId: null } as const;

export type BatchLogs =
  | { kind: 'notInABatch'; childRunId: null }
  | { kind: 'loading'; childRunId: string | null }
  | { kind: 'error'; childRunId: string | null; retry: () => unknown }
  | {
      kind: 'steps';
      steps: Record<string, StepOutput>;
      childRunId: string | null;
    }
  | {
      kind: BatchChildState;
      childRunId: string | null;
    };
