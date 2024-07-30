import {
  Check,
  CircleCheck,
  CircleX,
  PauseCircleIcon,
  PauseIcon,
  Timer,
  X,
} from 'lucide-react';

import { FlowRunStatus, StepOutputStatus } from '@activepieces/shared';

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
    Icon: typeof Timer | typeof Check | typeof PauseIcon | typeof X;
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
          Icon: Check,
        };
      case FlowRunStatus.FAILED:
        return {
          varient: 'error',
          Icon: X,
        };
      case FlowRunStatus.PAUSED:
        return {
          varient: 'default',
          Icon: PauseIcon,
        };
      case FlowRunStatus.QUOTA_EXCEEDED:
        return {
          varient: 'error',
          Icon: X,
        };
      case FlowRunStatus.INTERNAL_ERROR:
        return {
          varient: 'error',
          Icon: X,
        };
      case FlowRunStatus.TIMEOUT:
        return {
          varient: 'error',
          Icon: X,
        };
    }
  },
};
