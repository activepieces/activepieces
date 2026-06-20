import React from 'react';

import { cn } from '@/lib/utils';

type NotificationDotProps = React.HTMLAttributes<HTMLSpanElement> & {
  count?: number;
};

export const NotificationDot = React.forwardRef<
  HTMLSpanElement,
  NotificationDotProps
>(({ className, count, ...props }, ref) => {
  const hasCount = typeof count === 'number' && count > 0;

  if (!hasCount) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex size-2 shrink-0 rounded-full bg-destructive',
          className,
        )}
        {...props}
      />
    );
  }

  const label = count > 99 ? '99+' : count;

  return (
    <span
      ref={ref}
      className={cn('relative inline-flex h-4 min-w-4 shrink-0', className)}
      {...props}
    >
      <span className="absolute inset-0 inline-flex rounded-full bg-destructive opacity-75 animate-ping" />
      <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
        {label}
      </span>
    </span>
  );
});
NotificationDot.displayName = 'NotificationDot';
