'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const checkboxVariants = cva(
  'peer group/checkbox relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-gray-8 shadow-xs transition-shadow outline-none focus-visible:border-gray-8 focus-visible:ring-3 focus-visible:ring-gray-8/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-3 aria-invalid:ring-danger-9/20 dark:bg-gray-6/30 dark:aria-invalid:ring-danger-9/40',
  {
    variants: {
      variant: {
        primary:
          'data-checked:border-accent-9 data-checked:bg-accent-9 data-checked:text-on-accent data-[state=indeterminate]:border-accent-9 data-[state=indeterminate]:bg-accent-9 data-[state=indeterminate]:text-on-accent aria-invalid:aria-checked:border-accent-9 dark:data-checked:bg-accent-9 dark:data-[state=indeterminate]:bg-accent-9',
        secondary:
          'data-checked:border-gray-12 data-checked:bg-gray-12 data-checked:text-gray-1 data-[state=indeterminate]:border-gray-12 data-[state=indeterminate]:bg-gray-12 data-[state=indeterminate]:text-gray-1 dark:data-checked:bg-gray-12 dark:data-[state=indeterminate]:bg-gray-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

function Checkbox({ className, variant, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon className="group-data-[state=indeterminate]/checkbox:hidden" />
        <MinusIcon className="hidden group-data-[state=indeterminate]/checkbox:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, checkboxVariants };

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>;

export type { CheckboxProps };
