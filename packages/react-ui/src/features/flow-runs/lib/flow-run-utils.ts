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
