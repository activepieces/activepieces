import { t } from 'i18next';
import React from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { cn } from '@/lib/utils';
import { FlowRunStatus, StepOutputStatus } from '@activepieces/shared';

type StepStatusIconProps = {
  status: StepOutputStatus;
  runStatus?: FlowRunStatus;
  size: '3' | '4' | '5';
};

const statusText = {
  [StepOutputStatus.RUNNING]: t('Step running'),
  [StepOutputStatus.PAUSED]: t('Step paused'),
  [StepOutputStatus.STOPPED]: t('Step Stopped'),
  [StepOutputStatus.SUCCEEDED]: t('Step Succeeded'),
  [StepOutputStatus.FAILED]: t('Step Failed'),
};

const StepStatusIcon = React.memo(
  ({ status, size, runStatus }: StepStatusIconProps) => {
    const { variant, Icon } = flowRunUtils.getStatusIconForStep(status);

    if (
      runStatus === FlowRunStatus.RUNNING &&
      status === StepOutputStatus.RUNNING
    ) {
      return <LoadingSpinner className="w-4 h-4 "></LoadingSpinner>;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon
            className={cn('', {
              'w-3': size === '3',
              'w-4': size === '4',
              'h-3': size === '3',
              'h-4': size === '4',
              'w-5': size === '5',
              'h-5': size === '5',
              'text-success': variant === 'success',
              'text-destructive': variant === 'error',
              'text-foreground': variant === 'default',
            })}
          ></Icon>
        </TooltipTrigger>
        <TooltipContent side="bottom">{statusText[status]}</TooltipContent>
      </Tooltip>
    );
  },
);
StepStatusIcon.displayName = 'StepStatusIcon';
export { StepStatusIcon };
