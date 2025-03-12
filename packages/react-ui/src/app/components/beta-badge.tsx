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
            'bg-primary text-primary-foreground text-xs font-medium me-2 px-2.5 py-1 rounded-sm cursor-pointer',
            className,
          )}
          {...props}
        >
          {t('Beta')}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {t('This feature is still under testing and might be changed often')}
      </TooltipContent>
    </Tooltip>
  );
}
