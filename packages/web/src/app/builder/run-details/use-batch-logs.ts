import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowRunStatus,
  FlowTrigger,
  StepOutput,
  flowStructureUtil,
} from '@activepieces/shared';
import { useMemo } from 'react';

import { flowRunQueries, flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../builder-hooks';

import { BatchChild, batchRailUtils } from './batch-rail-utils';

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
    return batchRailUtils.parseStepOutput(stepOutput?.output);
  }, [run, batchStepName, loopsIndexes]);
  const barrierId = output?.barrierId ?? null;
  const total = isNil(output) ? 0 : batchRailUtils.batchCount(output);
  const current = Math.min(batchIndex, Math.max(total - 1, 0));

  const { data: childrenPage } = flowRunQueries.useBatchChildren({
    barrierId,
    limit: MAX_ENUMERATED_CHILDREN,
    enabled: total > 0 && total <= MAX_ENUMERATED_CHILDREN,
  });
  const { data: selectedPage, isLoading: isSelectedChildLoading } =
    flowRunQueries.useBatchChild({
      barrierId,
      dispatchIndex: current,
      enabled: total > 0,
    });

  const children = useMemo(
    () => toBatchChildren(childrenPage?.data),
    [childrenPage],
  );
  const selectedChild = toBatchChildren(selectedPage?.data)[0] ?? null;

  return {
    output,
    total,
    current,
    children,
    selectedChild,
    isSelectedChildLoading,
  };
};

export const useBatchLogs = (stepName: string | undefined): BatchLogs => {
  const trigger = useBuilderStateContext((state) => state.flowVersion.trigger);
  const batchStepName = useMemo(
    () =>
      isNil(stepName) ? null : enclosingBatchStepName({ stepName, trigger }),
    [trigger, stepName],
  );
  const { output, current, selectedChild, isSelectedChildLoading } =
    useBatchStepRun(batchStepName);
  const { data: childRun, isLoading: isChildRunLoading } =
    flowRunQueries.useBatchChildRun({ childRunId: selectedChild?.id ?? null });

  if (isNil(batchStepName) || isNil(output)) {
    return NOT_IN_A_BATCH;
  }
  if (isSelectedChildLoading || (!isNil(selectedChild) && isChildRunLoading)) {
    return { kind: 'loading', childRunId: selectedChild?.id ?? null };
  }
  const steps = childRun?.steps;
  if (!isNil(steps) && Object.keys(steps).length > 0) {
    return { kind: 'steps', steps, childRunId: selectedChild?.id ?? null };
  }
  return {
    kind: batchRailUtils.childState({
      output,
      batchIndex: current,
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
  return { stepOutput, batchLogs };
};

function enclosingBatchStepName({
  stepName,
  trigger,
}: {
  stepName: string;
  trigger: FlowTrigger;
}): string | null {
  return (
    flowStructureUtil
      .findPathToStep(trigger, stepName)
      .filter((step) => step.type === FlowActionType.PROCESS_IN_BATCHES)
      .filter((step) => flowStructureUtil.isChildOf(step, stepName))
      .at(-1)?.name ?? null
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

const MAX_ENUMERATED_CHILDREN = 100;

export type BatchLogs =
  | { kind: 'notInABatch'; childRunId: null }
  | { kind: 'loading'; childRunId: string | null }
  | {
      kind: 'steps';
      steps: Record<string, StepOutput>;
      childRunId: string | null;
    }
  | {
      kind:
        | 'neverStarted'
        | 'failedToDispatch'
        | 'stillRunning'
        | 'logsExpired';
      childRunId: string | null;
    };
