import { t } from 'i18next';
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  LucideIcon,
  PauseIcon,
  Play,
  Timer,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  FlowActionType,
  FlowRun,
  FlowRunStatus,
  flowStructureUtil,
  FlowTrigger,
  FlowVersion,
  isFailedState,
  isNil,
  LoopOnItemsAction,
  LoopStepOutput,
  StepOutput,
  StepOutputStatus,
} from '@activepieces/shared';

export const flowRunUtils = {
  findLastStepWithStatus,
  findLoopsState,
  extractStepOutput: (
    stepName: string,
    loopsIndexes: Record<string, number>,
    runOutput: Record<string, StepOutput>,
    trigger: FlowTrigger,
  ): StepOutput | undefined => {
    const stepOutput = runOutput[stepName];
    if (!isNil(stepOutput)) {
      return stepOutput;
    }
    const parents: LoopOnItemsAction[] = flowStructureUtil
      .findPathToStep(trigger, stepName)
      .filter(
        (p) =>
          p.type === FlowActionType.LOOP_ON_ITEMS &&
          flowStructureUtil.isChildOf(p, stepName),
      ) as LoopOnItemsAction[];

    if (parents.length > 0) {
      return getLoopChildStepOutput(parents, loopsIndexes, stepName, runOutput);
    }
    return undefined;
  },
  getStatusIconForStep(stepOutput: StepOutputStatus): {
    variant: 'default' | 'success' | 'error';
    Icon: LucideIcon;
    text: string;
  } {
    switch (stepOutput) {
      case StepOutputStatus.RUNNING:
        return {
          variant: 'default',
          Icon: Timer,
          text: t('Running'),
        };
      case StepOutputStatus.PAUSED:
        return {
          variant: 'default',
          Icon: PauseIcon,
          text: t('Paused'),
        };
      case StepOutputStatus.STOPPED:
      case StepOutputStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
          text: t('Succeeded'),
        };
      case StepOutputStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleAlert,
          text: t('Failed'),
        };
    }
  },
  getStatusContainerClassName(variant: 'default' | 'success' | 'error') {
    return cn('text-xs   border rounded-md leading-none', {
      'text-green-800 bg-green-50 border-green-200 dark:text-green-200 dark:bg-green-900 dark:border-green-800':
        variant === 'success',
      'text-red-800 bg-red-50  border-red-200 dark:text-red-200 dark:bg-red-900 dark:border-red-800':
        variant === 'error',
      'bg-background  border-border text-foreground': variant === 'default',
    });
  },
  getStatusIcon(status: FlowRunStatus): {
    variant: 'default' | 'success' | 'error';
    Icon: LucideIcon;
  } {
    switch (status) {
      case FlowRunStatus.QUEUED:
        return {
          variant: 'default',
          Icon: Timer,
        };
      case FlowRunStatus.RUNNING:
        return {
          variant: 'default',
          Icon: Play,
        };
      case FlowRunStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
        };
      case FlowRunStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
      case FlowRunStatus.PAUSED:
        return {
          variant: 'default',
          Icon: PauseIcon,
        };
      case FlowRunStatus.CANCELED:
        return {
          variant: 'default',
          Icon: CircleX,
        };
      case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
      case FlowRunStatus.QUOTA_EXCEEDED:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
      case FlowRunStatus.INTERNAL_ERROR:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
      case FlowRunStatus.TIMEOUT:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
    }
  },
};

function findLoopsState(
  flowVersion: FlowVersion,
  run: FlowRun,
  //runs get updated if they aren't terminated yet, so we shouldn't reset the loops state on each update
  currentLoopsState: Record<string, number>,
) {
  const loops = flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .filter((s) => s.type === FlowActionType.LOOP_ON_ITEMS);

  const loopsOutputs = loops.map((loop) => {
    //TODO: fix step outputs so we don't have to cast here
    const output = run.steps
      ? (run.steps[loop.name] as LoopStepOutput | undefined)
      : undefined;
    return {
      output,
      step: loop,
    };
  });
  const failedStep = run.steps
    ? findLastStepWithStatus(run.status, run.steps)
    : null;

  return loopsOutputs.reduce((res, { step, output }) => {
    const doesLoopIncludeFailedStep =
      failedStep && flowStructureUtil.isChildOf(step, failedStep);
    if (isNil(output)) {
      return {
        ...res,
        [step.name]: 0,
      };
    }
    if (doesLoopIncludeFailedStep && output.output) {
      return {
        ...res,
        [step.name]: output.output.iterations.length - 1,
      };
    }
    return {
      ...res,
      [step.name]: currentLoopsState[step.name] ?? 0,
    };
  }, currentLoopsState);
}

function findLastStepWithStatus(
  runStatus: FlowRunStatus,
  steps: Record<string, StepOutput> | undefined,
): string | null {
  if (isNil(steps)) {
    return null;
  }
  if (runStatus === FlowRunStatus.SUCCEEDED) {
    return null;
  }
  const stepStatus = isFailedState(runStatus)
    ? StepOutputStatus.FAILED
    : undefined;
  return Object.entries(steps).reduce((res, [stepName, step]) => {
    if (
      step.type === FlowActionType.LOOP_ON_ITEMS &&
      step.output &&
      isNil(res)
    ) {
      const latestStepInLoop = findLatestStepInLoop(
        step as LoopStepOutput,
        runStatus,
      );
      if (!isNil(latestStepInLoop)) {
        return latestStepInLoop;
      }
    }
    if (!isNil(stepStatus)) {
      if (step.status === stepStatus) {
        return stepName;
      }
      return null;
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
  loopsIndexes: Record<string, number>,
  childName: string,
  runOutput: Record<string, StepOutput>,
): StepOutput | undefined {
  if (parents.length === 0) {
    return undefined;
  }

  let currentStepOutput = runOutput[parents[0].name] as
    | LoopStepOutput
    | undefined;

  for (let loopLevel = 0; loopLevel < parents.length; loopLevel++) {
    const currentLoop = parents[loopLevel];
    const targetStepName = getTargetStepName(parents, loopLevel, childName);

    currentStepOutput = getStepOutputFromIteration({
      loopStepOutput: currentStepOutput,
      loopName: currentLoop.name,
      targetStepName,
      loopsIndexes,
    });

    if (!currentStepOutput) {
      return undefined;
    }
  }

  return currentStepOutput;
}

function getTargetStepName(
  parents: LoopOnItemsAction[],
  currentLoopLevel: number,
  childName: string,
): string {
  const hasMoreLevels = currentLoopLevel + 1 < parents.length;
  return hasMoreLevels ? parents[currentLoopLevel + 1].name : childName;
}

function getStepOutputFromIteration({
  loopStepOutput,
  loopName,
  targetStepName,
  loopsIndexes,
}: {
  loopStepOutput: LoopStepOutput | undefined;
  loopName: string;
  targetStepName: string;
  loopsIndexes: Record<string, number>;
}): LoopStepOutput | undefined {
  if (!loopStepOutput?.output) {
    return undefined;
  }

  const iterationIndex = loopsIndexes[loopName];
  const iterations = loopStepOutput.output.iterations;

  if (iterationIndex < 0 || iterationIndex >= iterations.length) {
    return undefined;
  }

  const targetIteration = iterations[iterationIndex];
  if (isNil(targetIteration)) {
    return undefined;
  }

  return targetIteration[targetStepName] as LoopStepOutput | undefined;
}
