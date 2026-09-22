import { isNil } from '@activepieces/core-utils';
import {
  executionJournal,
  FlowActionType,
  FlowRun,
  FlowRunStatus,
  isFailedState,
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

import { StatusVariant } from '@/components/custom/status-icon-with-text';
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
  pinLoopsToIterationsWithFailedStep(
    run: FlowRun,
    //runs get updated if they aren't terminated yet, so we shouldn't reset the loops state on each update
    currentLoopsState: Record<string, number>,
    options?: { liveFollowPaused?: boolean },
  ) {
    const loopsOutputs = executionJournal.getLoopSteps(run.steps);
    const latestStep = run.steps
      ? flowRunUtils.findLastStepWithStatus(run.status, run.steps)
      : null;
    const result = { ...currentLoopsState };

    Object.entries(loopsOutputs).forEach(([loopName, loopOutput]) => {
      const doesLoopIncludeLatestStep =
        latestStep && executionJournal.isChildOf(loopOutput, latestStep);

      if (isNil(loopOutput.output)) {
        result[loopName] = 0;
        return;
      }
      if (
        doesLoopIncludeLatestStep &&
        loopOutput.output &&
        !options?.liveFollowPaused
      ) {
        result[loopName] = loopOutput.output.iterations.length - 1;
        return;
      }
      result[loopName] = currentLoopsState[loopName] ?? 0;
    });
    return result;
  },
  snapLoopsToLatestIteration(
    run: FlowRun,
    currentLoopsState: Record<string, number>,
  ): Record<string, number> {
    const loopsOutputs = executionJournal.getLoopSteps(run.steps);
    const result = { ...currentLoopsState };
    Object.entries(loopsOutputs).forEach(([loopName, loopOutput]) => {
      if (!isNil(loopOutput.output)) {
        result[loopName] = loopOutput.output.iterations.length - 1;
      }
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
    variant: StatusVariant;
    Icon: LucideIcon;
    text: string;
    extraClassName?: string;
  } {
    switch (stepOutput) {
      case StepOutputStatus.RUNNING:
        return {
          variant: 'primary',
          Icon: Timer,
          text: t('Running'),
          extraClassName: 'text-primary-ink',
        };
      case StepOutputStatus.PAUSED:
        return {
          variant: 'warning',
          Icon: PauseIcon,
          text: t('Paused'),
          extraClassName: 'text-warning-ink',
        };
      case StepOutputStatus.STOPPED:
      case StepOutputStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
          text: t('Succeeded'),
          extraClassName: 'text-success-ink',
        };
      case StepOutputStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleAlert,
          text: t('Failed'),
          extraClassName: 'text-destructive-ink',
        };
    }
  },

  getStatusContainerClassName(
    variant: StatusVariant,
    withPaddingAndAnimation = false,
  ) {
    return cn('text-xs border rounded-md leading-tight', {
      'text-success-ink bg-success-surface border-success-line':
        variant === 'success',
      'text-destructive-ink bg-destructive-surface border-destructive-line':
        variant === 'error',
      'text-warning-ink bg-warning-surface border-warning-line':
        variant === 'warning',
      'text-primary-ink bg-primary-surface border-primary-line':
        variant === 'primary',
      'text-neutral-ink bg-neutral-surface border-neutral-line':
        variant === 'neutral',
      'bg-background border-border text-foreground': variant === 'default',
      'flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 items-center  justify-center px-2 py-0.5':
        withPaddingAndAnimation,
    });
  },

  getStatusIcon(status: FlowRunStatus): {
    variant: StatusVariant;
    Icon: LucideIcon;
  } {
    switch (status) {
      case FlowRunStatus.QUEUED:
        return {
          variant: 'neutral',
          Icon: Timer,
        };
      case FlowRunStatus.RUNNING:
        return {
          variant: 'primary',
          Icon: Play,
        };
      case FlowRunStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
      case FlowRunStatus.PAUSED:
        return {
          variant: 'warning',
          Icon: PauseIcon,
        };
      case FlowRunStatus.CANCELED:
        return {
          variant: 'neutral',
          Icon: CircleX,
        };
      case FlowRunStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
        };
      case FlowRunStatus.QUOTA_EXCEEDED:
        return {
          variant: 'warning',
          Icon: CircleAlert,
        };
      case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
      case FlowRunStatus.LOG_SIZE_EXCEEDED:
      case FlowRunStatus.INTERNAL_ERROR:
      case FlowRunStatus.TIMEOUT:
        return {
          variant: 'error',
          Icon: CircleAlert,
        };
    }
  },
  getStatusLabelOverride(status: FlowRunStatus): string | null {
    if (status === FlowRunStatus.QUOTA_EXCEEDED) {
      return t('Out of credits');
    }
    return null;
  },
};
