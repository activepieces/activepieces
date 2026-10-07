import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const dotVariants = cva('size-2 shrink-0 rounded-full', {
  variants: {
    tone: {
      success: 'bg-success-10',
      warning: 'bg-warning-10',
      danger: 'bg-danger-10',
      accent: 'bg-accent-10',
      neutral: 'bg-gray-9',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

export function StatusDot({
  tone,
  pulse = false,
  className,
  children,
}: StatusDotProps) {
  return (
    <span
      data-slot="status-dot"
      className={cn(
        'inline-flex min-w-0 items-center gap-2 text-sm text-gray-12',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(dotVariants({ tone }), pulse && 'animate-pulse')}
      />
      {children !== undefined && <span className="truncate">{children}</span>}
    </span>
  );
}

export type StatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'neutral';

type StatusDotProps = {
  tone: StatusTone;
  pulse?: boolean;
  className?: string;
  children?: ReactNode;
};
