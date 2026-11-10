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
          variant: 'default',
          Icon: Timer,
          text: t('Running'),
          extraClassName: 'text-gray-12 stroke-gray-12',
        };
      case StepOutputStatus.PAUSED:
        return {
          variant: 'warning',
          Icon: PauseIcon,
          text: t('Paused'),
          extraClassName: 'text-warning-11',
        };
      case StepOutputStatus.STOPPED:
      case StepOutputStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
          text: t('Succeeded'),
          extraClassName: 'text-success-11',
        };
      case StepOutputStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleAlert,
          text: t('Failed'),
          extraClassName: 'text-danger-11',
        };
    }
  },

  getStatusContainerClassName({
    variant,
    withPaddingAndAnimation = false,
  }: {
    variant: StatusVariant;
    withPaddingAndAnimation?: boolean;
  }) {
    return cn('text-xs border rounded-md leading-tight', {
      'text-success-11 bg-success-3 border-success-7': variant === 'success',
      'text-danger-11 bg-danger-3 border-danger-7': variant === 'error',
      'text-warning-11 bg-warning-3 border-warning-7': variant === 'warning',
      'text-accent-11 bg-accent-3 border-accent-7': variant === 'primary',
      'text-gray-11 bg-gray-3 border-gray-7': variant === 'neutral',
      'bg-gray-1 border-gray-6 text-gray-12': variant === 'default',
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
  getStatusLabelOverride(status: FlowRunStatus): string | null {
    if (status === FlowRunStatus.QUOTA_EXCEEDED) {
      return t('Out of credits');
    }
    return null;
  },
};
