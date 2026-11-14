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

import { Status, statusColors } from '@/lib/status-colors';
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
    Icon: LucideIcon;
    text: string;
  } {
    switch (stepOutput) {
      case StepOutputStatus.RUNNING:
        return { Icon: Timer, text: t('Running') };
      case StepOutputStatus.PAUSED:
        return { Icon: PauseIcon, text: t('Paused') };
      case StepOutputStatus.STOPPED:
      case StepOutputStatus.SUCCEEDED:
        return { Icon: CircleCheck, text: t('Succeeded') };
      case StepOutputStatus.FAILED:
        return { Icon: CircleAlert, text: t('Failed') };
    }
  },

  getStatusContainerClassName({
    status,
    withPaddingAndAnimation = false,
  }: {
    status: Status;
    withPaddingAndAnimation?: boolean;
  }) {
    const colors = statusColors.of(status);
    return cn(
      'text-xs border rounded-md leading-tight',
      colors.text,
      colors.background,
      colors.border,
      withPaddingAndAnimation &&
        'flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 items-center  justify-center px-2 py-0.5',
    );
  },

  getStatusIcon(status: FlowRunStatus): LucideIcon {
    switch (status) {
      case FlowRunStatus.QUEUED:
        return Timer;
      case FlowRunStatus.RUNNING:
        return Play;
      case FlowRunStatus.PAUSED:
        return PauseIcon;
      case FlowRunStatus.CANCELED:
        return CircleX;
      case FlowRunStatus.SUCCEEDED:
        return CircleCheck;
      case FlowRunStatus.FAILED:
      case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
      case FlowRunStatus.LOG_SIZE_EXCEEDED:
      case FlowRunStatus.QUOTA_EXCEEDED:
      case FlowRunStatus.INTERNAL_ERROR:
      case FlowRunStatus.TIMEOUT:
        return CircleAlert;
    }
  },
  getStatusLabelOverride(status: FlowRunStatus): string | null {
    if (status === FlowRunStatus.QUOTA_EXCEEDED) {
      return t('Out of credits');
    }
    return null;
  },
};
