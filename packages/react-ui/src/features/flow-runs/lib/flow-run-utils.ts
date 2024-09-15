import {
  Check,
  CircleCheck,
  CircleX,
  PauseCircleIcon,
  PauseIcon,
  Timer,
  X,
} from 'lucide-react';

import { ActionType, FlowRun, FlowRunStatus, isNil, LoopStepResult, StepOutputStatus } from '@activepieces/shared';

export const flowRunUtils = {
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

export const findFailedStepInLoop: (
  loopStepResult: LoopStepResult,
) => string | null = (loopStepResult) => {
  return loopStepResult.iterations.reduce((res, iteration) => {
    const failedStepWithinLoop = Object.entries(iteration).reduce(
      (res, [stepName, step]) => {
        if (step.status === StepOutputStatus.FAILED) {
          return stepName;
        }
        if (
          step.type === ActionType.LOOP_ON_ITEMS &&
          step.output &&
          isNil(res)
        ) {
          return findFailedStepInLoop(step.output);
        }
        return res;
      },
      null as null | string,
    );
    return res ?? failedStepWithinLoop;
  }, null as null | string);
};


export const findInitalIndexForLoop: (
  loopStepResult: LoopStepResult,
) =>  number = (loopStepResult) => {
  return loopStepResult.iterations.reduce((answer, iteration,index) => {
    const hasIterationFailed= Object.values(iteration).some(
      (step) => {
        if (step.status === StepOutputStatus.FAILED) {
          return true;
        }
        if (
          step.type === ActionType.LOOP_ON_ITEMS &&
          step.output         
        ) {
          const failedStepInLoop = findFailedStepInLoop(step.output);
          if(failedStepInLoop){
            return true;
          }
        }
        return false;
      },
      0
    );
    if(hasIterationFailed)
    {
      return index;
    }
    return answer;
  },0);
};

export const findFailedStep = (run: FlowRun) => {
  return Object.entries(run.steps).reduce((res, [stepName, step]) => {
    if (step.status === StepOutputStatus.FAILED) {
      return stepName;
    }
    if (step.type === ActionType.LOOP_ON_ITEMS && step.output && isNil(res)) {
      return findFailedStepInLoop(step.output);
    }
    return res;
  }, null as null | string);
};


export function hasRunFinished(runStatus: FlowRunStatus): boolean {
  return runStatus !== FlowRunStatus.RUNNING &&
  runStatus !== FlowRunStatus.PAUSED;
}
