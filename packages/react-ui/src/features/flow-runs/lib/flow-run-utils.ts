import { FlowRunStatus, StepOutputStatus } from '@activepieces/shared';
import {
  Check,
  CircleCheck,
  CircleX,
  PauseCircleIcon,
  Timer,
  X,
} from 'lucide-react';

export const flowRunUtils = {
  getStatusIconForStep(stepOutput: StepOutputStatus): {
    varient: 'default' | 'success' | 'error';
    Icon:
      | typeof Timer
      | typeof CircleCheck
      | typeof PauseCircleIcon
      | typeof CircleX;
  } {
    switch (stepOutput) {
      case StepOutputStatus.RUNNING:
        return {
          varient: 'default',
          Icon: Timer,
        };
      case StepOutputStatus.PAUSED:
        return {
          varient: 'default',
          Icon: PauseCircleIcon,
        };
      case StepOutputStatus.STOPPED:
      case StepOutputStatus.SUCCEEDED:
        return {
          varient: 'success',
          Icon: CircleCheck,
        };
      case StepOutputStatus.FAILED:
        return {
          varient: 'error',
          Icon: CircleX,
        };
    }
  },
  getStatusIcon(status: FlowRunStatus): {
    varient: 'default' | 'success' | 'error';
    Icon:
      | typeof Timer
      | typeof CircleCheck
      | typeof PauseCircleIcon
      | typeof CircleX;
  } {
    switch (status) {
      case FlowRunStatus.RUNNING:
        return {
          varient: 'default',
          Icon: Timer,
        };
      case FlowRunStatus.SUCCEEDED:
        return {
          varient: 'success',
          Icon: Check,
        };
      case FlowRunStatus.STOPPED:
        return {
          varient: 'success',
          Icon: CircleCheck,
        };
      case FlowRunStatus.FAILED:
        return {
          varient: 'error',
          Icon: X,
        };
      case FlowRunStatus.PAUSED:
        return {
          varient: 'default',
          Icon: PauseCircleIcon,
        };
      case FlowRunStatus.QUOTA_EXCEEDED:
        return {
          varient: 'error',
          Icon: CircleX,
        };
      case FlowRunStatus.INTERNAL_ERROR:
        return {
          varient: 'error',
          Icon: CircleX,
        };
      case FlowRunStatus.TIMEOUT:
        return {
          varient: 'error',
          Icon: CircleX,
        };
    }
  },
};
