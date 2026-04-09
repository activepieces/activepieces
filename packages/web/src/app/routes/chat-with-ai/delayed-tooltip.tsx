import { Tooltip as TooltipPrimitive } from 'radix-ui';
import * as React from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

export function DelayedTooltip({
  delayDuration = 400,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & {
  delayDuration?: number;
}) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root data-slot="tooltip" {...props}>
        {children}
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}
