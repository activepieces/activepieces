'use client';

import { Remove01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cva, type VariantProps } from 'class-variance-authority';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import * as React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { cn } from '@/lib/utils';

const checkboxVariants = cva(
  'peer size-4 shrink-0 rounded-[4px] border border-gray-8 shadow-xs transition-shadow outline-none focus-visible:border-accent-8 focus-visible:ring-[3px] focus-visible:ring-accent-8/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-danger-9/20 dark:bg-gray-6/30 dark:aria-invalid:ring-danger-9/40',
  {
    variants: {
      variant: {
        primary:
          'data-[state=checked]:bg-accent-9 data-[state=checked]:text-on-accent dark:data-[state=checked]:bg-accent-9 data-[state=checked]:border-accent-9 data-[state=indeterminate]:bg-accent-9 data-[state=indeterminate]:text-on-accent data-[state=indeterminate]:border-accent-9',
        secondary:
          'data-[state=checked]:bg-gray-12 data-[state=checked]:text-gray-1 data-[state=checked]:border-gray-12 data-[state=indeterminate]:bg-gray-12 data-[state=indeterminate]:text-gray-1 data-[state=indeterminate]:border-gray-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

function Checkbox({ className, variant, checked, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={checked}
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        {checked === 'indeterminate' ? (
          <HugeiconsIcon
            icon={Remove01Icon}
            className="size-3.5 text-current"
          />
        ) : (
          <HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-current" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, checkboxVariants };

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>;

export type { CheckboxProps };
