import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const statusDotVariants = cva('size-1.5 shrink-0 rounded-full', {
  variants: {
    tone: {
      success: 'bg-success-9',
      warning: 'bg-warning-9',
      danger: 'bg-danger-9',
      accent: 'bg-accent-9',
      neutral: 'bg-gray-8',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

function StatusDot({
  tone,
  pulse = false,
  className,
  children,
  ...props
}: StatusDotProps) {
  return (
    <span
      data-slot="status-dot"
      className={cn(
        'inline-flex min-w-0 items-center gap-2 text-sm text-gray-12',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(statusDotVariants({ tone }), pulse && 'animate-pulse')}
      />
      {children !== undefined && <span className="truncate">{children}</span>}
    </span>
  );
}

export { StatusDot };

type StatusDotProps = React.ComponentProps<'span'> &
  VariantProps<typeof statusDotVariants> & {
    pulse?: boolean;
  };
