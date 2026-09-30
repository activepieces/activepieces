import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-accent-8 focus-visible:ring-3 focus-visible:ring-accent-8/50 aria-invalid:border-danger-9 aria-invalid:ring-danger-9/20 [&>svg]:pointer-events-none [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        outline:
          'border-gray-7 text-gray-12 [a]:hover:bg-gray-3 [a]:hover:text-gray-12',
        secondary: 'bg-gray-3 text-gray-12 [a]:hover:bg-gray-4',
        info: 'border-accent-7 bg-accent-3 text-accent-11',
        success: 'border-success-7 bg-success-3 text-success-11',
        warning: 'border-warning-7 bg-warning-3 text-warning-11',
        destructive: 'border-danger-7 bg-danger-3 text-danger-11',
        ghost: 'hover:bg-gray-3 hover:text-gray-12',
        link: 'text-accent-11 underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  },
);

function Badge({
  className,
  variant = 'outline',
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
