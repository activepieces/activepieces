import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'group/toggle inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap text-gray-11 transition-[color,box-shadow] outline-none hover:bg-gray-3 hover:text-gray-12 focus-visible:border-accent-8 focus-visible:ring-3 focus-visible:ring-accent-8/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-danger-9/20 data-[state=on]:bg-gray-4 data-[state=on]:text-gray-12 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-gray-7 bg-transparent shadow-xs hover:bg-gray-3',
      },
      size: {
        default:
          "h-9 min-w-9 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-8 min-w-8 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 min-w-10 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
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
  variant = 'default',
  size = 'default',
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
