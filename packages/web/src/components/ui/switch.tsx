import { Switch as SwitchPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Switch({
  className,
  size = 'default',
  indeterminate = false,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default';
  indeterminate?: boolean;
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-indeterminate={indeterminate || undefined}
      className={cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-accent-8 focus-visible:ring-3 focus-visible:ring-accent-8/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-3 aria-invalid:ring-danger-9/20 data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8 data-checked:bg-accent-9 data-unchecked:bg-gray-6',
        indeterminate &&
          'justify-center data-unchecked:border-accent-8 data-unchecked:bg-accent-5',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-panel shadow-xs ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
