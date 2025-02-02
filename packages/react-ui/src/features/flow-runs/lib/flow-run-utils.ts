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
  isNil,
  LoopOnItemsAction,
  LoopStepOutput,
  StepOutput,
  StepOutputStatus,
  Trigger,
} from '@activepieces/shared';

export const flowRunUtils = {
  findFailedStepInOutput,
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
  const failedStep = run.steps ? findFailedStepInOutput(run.steps) : null;

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

function findFailedStepInOutput(
  steps: Record<string, StepOutput>,
): string | null {
  return Object.entries(steps).reduce((res, [stepName, step]) => {
    if (step.status === StepOutputStatus.FAILED) {
      return stepName;
    }
    if (step.type === ActionType.LOOP_ON_ITEMS && step.output && isNil(res)) {
      return findFailedStepInLoop(step as LoopStepOutput);
    }
    return res;
  }, null as null | string);
}

function findFailedStepInLoop(loopStepResult: LoopStepOutput): string | null {
  if (!loopStepResult.output) {
    return null;
  }
  for (const iteration of loopStepResult.output.iterations) {
    const failedStep = findFailedStepInOutput(iteration);
    if (failedStep) return failedStep;
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
