import {
  Check,
  CircleCheck,
  CircleX,
  PauseCircleIcon,
  PauseIcon,
  Timer,
  X,
} from 'lucide-react';

import {
  ActionType,
  FlowRun,
  FlowRunStatus,
  flowStructureUtil,
  FlowVersion,
  isFailedState,
  isNil,
  LoopOnItemsAction,
  LoopStepOutput,
  StepOutput,
  StepOutputStatus,
  Trigger,
} from '@activepieces/shared';

export const flowRunUtils = {
  findLastStepWithStatus,
  findLoopsState,
  extractStepOutput,
  getStatusIconForStep(stepOutput: StepOutputStatus): {
    variant: 'default' | 'success' | 'error';
    Icon:
      | typeof Timer
      | typeof CircleCheck
      | typeof PauseCircleIcon
      | typeof CircleX;
  } {
    switch (stepOutput) {
      case StepOutputStatus.RUNNING:
        return {
          variant: 'default',
          Icon: Timer,
        };
      case StepOutputStatus.PAUSED:
        return {
          variant: 'default',
          Icon: PauseCircleIcon,
        };
      case StepOutputStatus.STOPPED:
      case StepOutputStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
        };
      case StepOutputStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleX,
        };
    }
  },
  getStatusIcon(status: FlowRunStatus): {
    variant: 'default' | 'success' | 'error';
    Icon: typeof Timer | typeof Check | typeof PauseIcon | typeof X;
  } {
    switch (status) {
      case FlowRunStatus.RUNNING:
        return {
          variant: 'default',
          Icon: Timer,
        };
      case FlowRunStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: Check,
        };
      case FlowRunStatus.STOPPED:
        return {
          variant: 'success',
          Icon: Check,
        };
      case FlowRunStatus.FAILED:
        return {
          variant: 'error',
          Icon: X,
        };
      case FlowRunStatus.PAUSED:
        return {
          variant: 'default',
          Icon: PauseIcon,
        };
      case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
        return {
          variant: 'error',
          Icon: X,
        };
      case FlowRunStatus.QUOTA_EXCEEDED:
        return {
          variant: 'error',
          Icon: X,
        };
      case FlowRunStatus.INTERNAL_ERROR:
        return {
          variant: 'error',
          Icon: X,
        };
      case FlowRunStatus.TIMEOUT:
        return {
          variant: 'error',
          Icon: X,
        };
    }
  },
};

function findLoopsState(
  flowVersion: FlowVersion,
  run: FlowRun,
  currentLoopsState: Record<string, number>,
) {
  const loops = flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .filter((s) => s.type === ActionType.LOOP_ON_ITEMS);
  const failedStep = run.steps
    ? findLastStepWithStatus(run.status, run.steps)
    : null;

  return loops.reduce(
    (res, step) => ({
      ...res,
      [step.name]:
        failedStep && flowStructureUtil.isChildOf(step, failedStep)
          ? Number.MAX_SAFE_INTEGER
          : currentLoopsState[step.name] ?? 0,
    }),
    currentLoopsState,
  );
}

function findLastStepWithStatus(
  runStatus: FlowRunStatus,
  steps: Record<string, StepOutput>,
): string | null {
  if (
    runStatus === FlowRunStatus.STOPPED ||
    runStatus === FlowRunStatus.SUCCEEDED
  ) {
    return null;
  }
  const stepStatus = isFailedState(runStatus)
    ? StepOutputStatus.FAILED
    : undefined;
  return Object.entries(steps).reduce((res, [stepName, step]) => {
    if (step.type === ActionType.LOOP_ON_ITEMS && step.output && isNil(res)) {
      return findLatestStepInLoop(step as LoopStepOutput, runStatus);
    }
    if (!isNil(stepStatus) && step.status === stepStatus) {
      return res;
    }
    return stepName;
  }, null as null | string);
}

function findLatestStepInLoop(
  loopStepResult: LoopStepOutput,
  runStatus: FlowRunStatus,
): string | null {
  if (!loopStepResult.output) {
    return null;
  }
  for (const iteration of loopStepResult.output.iterations) {
    const lastStep = findLastStepWithStatus(runStatus, iteration);
    if (!isNil(lastStep)) {
      return lastStep;
    }
  }
  return null;
}

function getLoopChildStepOutput(
  parents: LoopOnItemsAction[],
  loopIndexes: Record<string, number>,
  childName: string,
  runOutput: Record<string, StepOutput>,
): StepOutput | undefined {
  if (parents.length === 0) {
    return undefined;
  }
  let childOutput: LoopStepOutput | undefined = runOutput[parents[0].name] as
    | LoopStepOutput
    | undefined;

  let index = 0;
  while (index < parents.length) {
    const currentParentName = parents[index].name;
    if (
      childOutput &&
      childOutput.output &&
      childOutput.output.iterations[loopIndexes[currentParentName]]
    ) {
      const stepName =
        index + 1 < parents.length ? parents[index + 1].name : childName;
      childOutput = childOutput.output.iterations[
        loopIndexes[parents[index].name]
      ][stepName] as LoopStepOutput | undefined;
    }
    index++;
  }
  return childOutput;
}

function extractStepOutput(
  stepName: string,
  loopIndexes: Record<string, number>,
  output: Record<string, StepOutput>,
  trigger: Trigger,
): StepOutput | undefined {
  const stepOutput = output[stepName];
  if (stepOutput) {
    return stepOutput;
  }
  const parents: LoopOnItemsAction[] = flowStructureUtil
    .findPathToStep(trigger, stepName)
    .filter(
      (p) =>
        p.type === ActionType.LOOP_ON_ITEMS &&
        flowStructureUtil.isChildOf(p, stepName),
    ) as LoopOnItemsAction[];

  if (parents.length > 0) {
    return getLoopChildStepOutput(parents, loopIndexes, stepName, output);
  }
  return undefined;
}
