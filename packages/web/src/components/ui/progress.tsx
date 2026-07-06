'use client';

import { Progress as ProgressPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  indicatorClassName,
  usage = false,
  ...props
}: ProgressProps) {
  const percent = value || 0;
  const filled = usage ? 100 - percent : percent;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full w-full flex-1 bg-primary transition-all',
          usage && usageIndicatorClass(percent / 100),
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - filled}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

function usageIndicatorClass(ratio: number): string {
  if (ratio >= 0.85) {
    return 'bg-destructive';
  }
  if (ratio >= 0.7) {
    return 'bg-amber-500';
  }
  return 'bg-primary';
}

export { Progress };

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
  usage?: boolean;
};
