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
        'bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm font-semibold select-none',
        className,
      )}
      {...props}
    >
      {t('BETA')}
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
