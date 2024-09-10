import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/lib/utils';

const dotVariants = cva('size-2 rounded-full', {
  variants: {
    variant: {
      destructive: 'bg-destructive',
      primary: 'bg-primary',
    },
  },
  defaultVariants: {},
});

interface DotProps
  extends VariantProps<typeof dotVariants>,
    React.HTMLAttributes<HTMLDivElement> {
  animation?: boolean;
}

const Dot = React.forwardRef<HTMLDivElement, DotProps>(
  ({ className, animation = false, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          dotVariants({ variant }),
          animation && 'animate-pulse',
          className,
        )}
        {...props}
      />
    );
  },
);

Dot.displayName = 'Dot';

export { Dot };
