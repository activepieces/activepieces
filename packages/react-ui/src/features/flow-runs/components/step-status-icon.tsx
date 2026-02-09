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
import { StepOutputStatus } from '@activepieces/shared';

type StepStatusIconProps = {
  status: StepOutputStatus;
  size: '3' | '4' | '5' | '4.5';
  hideTooltip?: boolean;
};

const statusText = {
  [StepOutputStatus.RUNNING]: t('Step running'),
  [StepOutputStatus.PAUSED]: t('Step paused'),
  [StepOutputStatus.STOPPED]: t('Step Stopped'),
  [StepOutputStatus.SUCCEEDED]: t('Step Succeeded'),
  [StepOutputStatus.FAILED]: t('Step Failed'),
};

const StepStatusIcon = React.memo(
  ({ status, size, hideTooltip = false }: StepStatusIconProps) => {
    const { variant, Icon } = flowRunUtils.getStatusIconForStep(status);

    if (status === StepOutputStatus.RUNNING) {
      return <LoadingSpinner className="w-3 h-3 "></LoadingSpinner>;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon
            className={cn('', {
              'size-3': size === '3',
              'size-4.5': size === '4.5',
              'size-4': size === '4',
              'size-5': size === '5',
              'text-green-700 dark:text-green-200': variant === 'success',
              'text-red-700 dark:text-red-200': variant === 'error',
              'text-foreground': variant === 'default',
            })}
          ></Icon>
        </TooltipTrigger>
        {!hideTooltip && (
          <TooltipContent side="bottom">{statusText[status]}</TooltipContent>
        )}
      </Tooltip>
    );
  },
);
StepStatusIcon.displayName = 'StepStatusIcon';
export { StepStatusIcon };
