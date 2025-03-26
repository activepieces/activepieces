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
  showTooltip?: boolean;
}

export function BetaBadge({
  className,
  showTooltip = true,
  ...props
}: BetaBadgeProps) {
  const badge = (
    <span
      className={cn(
        'border-primary/50 border-1 bg-primary text-background border-solid  text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm  select-none',
        className,
      )}
      {...props}
    >
      {t('Beta')}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        {t('This feature is still under testing and might be changed often')}
      </TooltipContent>
    </Tooltip>
  );
}
