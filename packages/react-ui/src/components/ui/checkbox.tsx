'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { cva, type VariantProps } from 'class-variance-authority';
import { Minus } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-xs border shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-primary-foreground',
  {
    variants: {
      variant: {
        primary: 'border-primary data-[state=checked]:bg-primary',
        secondary:
          'border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
    VariantProps<typeof checkboxVariants>
>(({ className, variant, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ variant, className }))}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      {props.checked === 'indeterminate' ? (
        <Minus className="h-4 w-4 text-primary " />
      ) : (
        <CheckIcon className="h-4 w-4" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, checkboxVariants };
