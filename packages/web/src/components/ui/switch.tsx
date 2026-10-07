import { Switch as SwitchPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Switch({
  className,
  size = 'default',
  indeterminate = false,
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-8 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent-9 data-[state=unchecked]:bg-gray-8',
        size === 'sm' ? 'h-4 w-7' : 'h-5 w-9',
        indeterminate &&
          'justify-center data-[state=unchecked]:border-accent-8 data-[state=unchecked]:bg-accent-5',
        className,
      )}
      {...props}
      data-indeterminate={indeterminate || undefined}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-gray-1 shadow-xs ring-0 transition-transform data-[state=checked]:bg-on-accent data-[state=unchecked]:translate-x-0',
          size === 'sm'
            ? 'size-3 data-[state=checked]:translate-x-3'
            : 'size-4 data-[state=checked]:translate-x-4',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'default' | 'sm';
  indeterminate?: boolean;
};

export { Switch };
export type { SwitchProps };
