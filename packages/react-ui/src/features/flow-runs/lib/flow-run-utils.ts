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
  ExecutionJournal,
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


function mapFlowRunStatusToStepOutputStatus(status: FlowRunStatus): StepOutputStatus | undefined {
  switch (status) {
    case FlowRunStatus.FAILED:
      return StepOutputStatus.FAILED
    case FlowRunStatus.SUCCEEDED:
      return StepOutputStatus.SUCCEEDED
    case FlowRunStatus.PAUSED:
      return StepOutputStatus.PAUSED
    case FlowRunStatus.RUNNING:
      return StepOutputStatus.RUNNING
    default:
      return undefined
  }
}

export const flowRunUtils = {
  updateRunSteps: (steps: Record<string, StepOutput>, stepName: string, path: readonly [string, number][], output: StepOutput) => {
    return new ExecutionJournal(steps).upsertStep({ stepName, stepOutput: output, path, createLoopIterationIfNotExists: true })
  },
  /*
  * Find the last step that has a status , or the last failed step
  */
  findLastStepWithStatus(runStatus: FlowRunStatus, steps: Record<string, StepOutput>): string | null {
    let lastStepWithStatus: string | null = null
    if (runStatus === FlowRunStatus.SUCCEEDED) {
      return null;
      }
    const runFailed = isFailedState(runStatus)
  
    Object.entries(steps).forEach(([stepName, step]) => {
        if (runFailed && step.status === StepOutputStatus.FAILED) {
          lastStepWithStatus = stepName
        }
        if (!runFailed) {
          lastStepWithStatus = stepName
        }

        if (step.type === FlowActionType.LOOP_ON_ITEMS && step.output) {
          const iterations = step.output.iterations
          iterations.forEach((iteration) => {
            const lastOneInIteration = flowRunUtils.findLastStepWithStatus(runStatus, iteration)
            if (!isNil(lastOneInIteration)) {
              lastStepWithStatus = lastOneInIteration
            }
          })
        }
      
    })
    return lastStepWithStatus
  },
  findLoopsState(
    run: FlowRun,
    //runs get updated if they aren't terminated yet, so we shouldn't reset the loops state on each update
    currentLoopsState: Record<string, number>,
  ) {
  
    const loopsOutputs = ExecutionJournal.getLoopSteps(run.steps);
    const failedStep = run.steps
      ? flowRunUtils.findLastStepWithStatus(run.status, run.steps)
      : null;
    const result = currentLoopsState
  
     Object.entries(loopsOutputs).forEach(([loopName, loopOutput]) => {
      const doesLoopIncludeFailedStep =
        failedStep && ExecutionJournal.isChildOf(loopOutput, failedStep);
  
      if (isNil(loopOutput.output)) {
        result[loopName] = 0;
        return;
      }
      if (doesLoopIncludeFailedStep && loopOutput.output) {
        result[loopName] = loopOutput.output.iterations.length - 1;
        return;
      }
      result[loopName] = currentLoopsState[loopName] ?? 0;
    });
    return result;
  },
  
  extractStepOutput: (
    stepName: string,
    loopsIndexes: Record<string, number>,
    runOutput: Record<string, StepOutput>,
  ): StepOutput | undefined => {
    const stepOutput = runOutput[stepName];
    if (!isNil(stepOutput)) {
      return stepOutput;
    }

    const path = ExecutionJournal.getPathToStep(runOutput, stepName, loopsIndexes) ?? [];
    try {
      return new ExecutionJournal(runOutput).getStep({ stepName, path });
    } catch (error) {
      return undefined;
    }
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

