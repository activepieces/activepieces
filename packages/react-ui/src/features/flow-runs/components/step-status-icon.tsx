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
    const { Icon, extraClassName } = flowRunUtils.getStatusIconForStep(status);
    const sizeClassName = {
      'size-3': size === '3',
      'size-4.5': size === '4.5',
      'size-4': size === '4',
      'size-5': size === '5',
    };
    const className = cn(extraClassName, sizeClassName);
    if (status === StepOutputStatus.RUNNING) {
      return <LoadingSpinner className={className}></LoadingSpinner>;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={className}></Icon>
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
