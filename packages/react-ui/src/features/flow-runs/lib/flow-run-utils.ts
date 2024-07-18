import { CircleCheck, CircleX, PauseCircleIcon, Timer } from 'lucide-react';

import { FlowRunStatus } from '@activepieces/shared';

export const flowRunUtils = {
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
          Icon: CircleCheck,
        };
      case FlowRunStatus.STOPPED:
        return {
          varient: 'success',
          Icon: CircleCheck,
        };
      case FlowRunStatus.FAILED:
        return {
          varient: 'error',
          Icon: CircleX,
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
