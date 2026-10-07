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
        'peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-gray-8 focus-visible:ring-3 focus-visible:ring-gray-8/50 aria-invalid:border-danger-9 aria-invalid:ring-3 aria-invalid:ring-danger-9/20 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 dark:aria-invalid:ring-danger-9/40 data-checked:bg-accent-9 data-unchecked:bg-gray-8 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        indeterminate &&
          'justify-center data-unchecked:border-accent-8 data-unchecked:bg-accent-5',
        className,
      )}
      {...props}
      data-indeterminate={indeterminate || undefined}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-gray-1 shadow-xs ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-checked:translate-x-[calc(100%+1px)] data-checked:bg-on-accent data-unchecked:translate-x-px',
          indeterminate && 'data-unchecked:translate-x-0',
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
