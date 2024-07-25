import React from 'react';

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
  size: '3' | '4' | '5';
};

const statusText = {
  [StepOutputStatus.RUNNING]: 'Step running',
  [StepOutputStatus.PAUSED]: 'Step paused',
  [StepOutputStatus.STOPPED]: 'Step Succeeded',
  [StepOutputStatus.SUCCEEDED]: 'Step Succeeded',
  [StepOutputStatus.FAILED]: 'Step Failed',
};
const StepStatusIcon = React.memo(({ status, size }: StepStatusIconProps) => {
  const { varient, Icon } = flowRunUtils.getStatusIconForStep(status);

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
            'text-success': varient === 'success',
            'text-destructive': varient === 'error',
            'text-foreground': varient === 'default',
          })}
        ></Icon>
      </TooltipTrigger>
      <TooltipContent side="bottom">{statusText[status]}</TooltipContent>
    </Tooltip>
  );
});
StepStatusIcon.displayName = 'StepStatusIcon';
export { StepStatusIcon };
