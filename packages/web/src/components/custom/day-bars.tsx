import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function DayBars({
  days,
  className,
  size = 'default',
}: {
  days: DayBar[];
  className?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <div
      data-slot="day-bars"
      className={cn(
        'flex items-end gap-0.5',
        size === 'sm' ? 'h-5' : 'h-8',
        className
      )}
    >
      {days.map((day) => (
        <Tooltip key={day.key}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'block h-full min-w-1 flex-1 rounded-full',
                DAY_TONE[day.tone]
              )}
            />
          </TooltipTrigger>
          <TooltipContent>{day.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

const DAY_TONE: Record<DayBar['tone'], string> = {
  success: 'bg-success-9',
  warning: 'bg-warning-9',
  danger: 'bg-danger-9',
  empty: 'bg-gray-4',
};

export { DayBars };

export type DayBar = {
  key: string;
  tone: 'success' | 'warning' | 'danger' | 'empty';
  label: React.ReactNode;
};
