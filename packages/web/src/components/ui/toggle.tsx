'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-gray-3 hover:text-gray-11 focus-visible:border-gray-8 focus-visible:ring-[3px] focus-visible:ring-gray-8/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-danger-9/20 data-[state=on]:bg-gray-4 data-[state=on]:text-gray-12 dark:aria-invalid:ring-danger-9/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-gray-6 bg-transparent shadow-xs hover:bg-gray-4 hover:text-gray-12',
      },
      size: {
        default: 'h-9 min-w-9 px-2',
        sm: 'h-7.5 px-2',
        lg: 'h-10 min-w-10 px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
