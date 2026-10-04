import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-1.5 py-px text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-accent-8 focus-visible:ring-[3px] focus-visible:ring-accent-8/50 aria-invalid:border-danger-9 aria-invalid:ring-danger-9/20 dark:aria-invalid:ring-danger-9/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-accent-9 text-on-accent [a&]:hover:bg-accent-9/90',
        secondary: 'bg-gray-3 text-gray-12 [a&]:hover:bg-gray-4',
        destructive: 'bg-danger-3 text-danger-11 border-danger-7',
        success: 'bg-success-3 text-success-11 border-success-7',
        warning: 'bg-warning-3 text-warning-11 border-warning-7',
        info: 'bg-accent-3 text-accent-11 border-accent-7',
        neutral: 'bg-gray-3 text-gray-11 border-gray-7',
        accent: 'bg-gray-4 text-gray-12 border-gray-6',
        outline:
          'border-gray-6 text-gray-12 [a&]:hover:bg-gray-4 [a&]:hover:text-gray-12',
        ghost: '[a&]:hover:bg-gray-4 [a&]:hover:text-gray-12',
        link: 'text-accent-11 underline-offset-4 [a&]:hover:underline',
        inverted: 'text-accent-11 bg-accent-3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
