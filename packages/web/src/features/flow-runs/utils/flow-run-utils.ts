import {
  executionJournal,
  FlowActionType,
  FlowRun,
  FlowRunStatus,
  isFailedState,
  isNil,
  StepOutput,
  StepOutputStatus,
} from '@activepieces/shared';
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

export const flowRunUtils = {
  updateRunSteps: (
    steps: Record<string, StepOutput>,
    stepName: string,
    path: readonly [string, number][],
    output: StepOutput,
  ) => {
    return executionJournal.upsertStep({
      stepName,
      stepOutput: output,
      path,
      steps,
      createLoopIterationIfNotExists: true,
    });
  },
  /*
   * Find the last step that has a status , or the last failed step
   */
  findLastStepWithStatus(
    runStatus: FlowRunStatus,
    steps: Record<string, StepOutput>,
  ): string | null {
    let lastStepWithStatus: string | null = null;
    if (runStatus === FlowRunStatus.SUCCEEDED) {
      return null;
    }
    const runFailed = isFailedState(runStatus);

    Object.entries(steps).forEach(([stepName, step]) => {
      if (runFailed && step.status === StepOutputStatus.FAILED) {
        lastStepWithStatus = stepName;
      }
      if (!runFailed) {
        lastStepWithStatus = stepName;
      }

      if (step.type === FlowActionType.LOOP_ON_ITEMS && step.output) {
        const iterations = step.output.iterations;
        iterations.forEach((iteration) => {
          const lastOneInIteration = flowRunUtils.findLastStepWithStatus(
            runStatus,
            iteration,
          );
          if (!isNil(lastOneInIteration)) {
            lastStepWithStatus = lastOneInIteration;
          }
        });
      }
    });
    return lastStepWithStatus;
  },
  findLoopsState(
    run: FlowRun,
    //runs get updated if they aren't terminated yet, so we shouldn't reset the loops state on each update
    currentLoopsState: Record<string, number>,
  ) {
    const loopsOutputs = executionJournal.getLoopSteps(run.steps);
    const failedStep = run.steps
      ? flowRunUtils.findLastStepWithStatus(run.status, run.steps)
      : null;
    const result = currentLoopsState;

    Object.entries(loopsOutputs).forEach(([loopName, loopOutput]) => {
      const doesLoopIncludeFailedStep =
        failedStep && executionJournal.isChildOf(loopOutput, failedStep);

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

    const path =
      executionJournal.getPathToStep(runOutput, stepName, loopsIndexes) ?? [];
    try {
      return executionJournal.getStep({ stepName, path, steps: runOutput });
    } catch (error) {
      return undefined;
    }
  },

  getStatusIconForStep(stepOutput: StepOutputStatus): {
    variant: 'default' | 'success' | 'error';
    Icon: LucideIcon;
    text: string;
    extraClassName?: string;
  } {
    switch (stepOutput) {
      case StepOutputStatus.RUNNING:
        return {
          variant: 'default',
          Icon: Timer,
          text: t('Running'),
          extraClassName: 'text-foreground',
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
          extraClassName: 'text-success-700 dark:text-success-200',
        };
      case StepOutputStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleAlert,
          text: t('Failed'),
          extraClassName: 'text-destructive-700 dark:text-destructive-200',
        };
    }
  },

  getStatusContainerClassName(
    variant: 'default' | 'success' | 'error' | 'warning',
    withPaddingAndAnimation = false,
  ) {
    return cn('text-xs border rounded-md leading-tight', {
      'text-success-800 bg-success-50 border-success-200 dark:text-success-200 dark:bg-success-900 dark:border-success-800':
        variant === 'success',
      'text-destructive-800 bg-destructive-50 border-destructive-200 dark:text-destructive-200 dark:bg-destructive-900 dark:border-destructive-800':
        variant === 'error',
      'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-600 dark:bg-amber-950 dark:border-amber-900':
        variant === 'warning',
      'bg-background  border-border text-foreground': variant === 'default',
      'flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 items-center  justify-center px-2 py-0.5':
        withPaddingAndAnimation,
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
      case FlowRunStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
        };
      case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
      case FlowRunStatus.LOG_SIZE_EXCEEDED:
      case FlowRunStatus.QUOTA_EXCEEDED:
      case FlowRunStatus.INTERNAL_ERROR:
      case FlowRunStatus.TIMEOUT:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
    }
  },
};
