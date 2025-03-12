import { t } from 'i18next';
import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BetaBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

export function BetaBadge({ className, ...props }: BetaBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'border border-primary text-primary border-2 font-semibold text-xs  me-2 px-2.5 py-1 rounded-sm select-none',
            className,
          )}
          {...props}
        >
          {t('BETA')}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {t('This feature is still under testing and might be changed often')}
      </TooltipContent>
    </Tooltip>
  );
}
