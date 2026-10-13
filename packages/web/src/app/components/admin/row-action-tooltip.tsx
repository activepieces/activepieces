import * as React from 'react';
import { useRef, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function RowActionTooltip({
  label,
  side,
  children,
  ...triggerProps
}: RowActionTooltipProps) {
  const [open, setOpen] = useState(false);
  const hoveredRef = useRef(false);
  const focusVisibleRef = useRef(false);

  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        setOpen(next && (hoveredRef.current || focusVisibleRef.current));
      }}
    >
      <TooltipTrigger
        asChild
        {...triggerProps}
        onPointerEnter={(event) => {
          hoveredRef.current = true;
          triggerProps.onPointerEnter?.(event);
        }}
        onPointerLeave={(event) => {
          hoveredRef.current = false;
          triggerProps.onPointerLeave?.(event);
        }}
        onFocus={(event) => {
          focusVisibleRef.current = isFocusVisible(event.currentTarget);
          triggerProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          focusVisibleRef.current = false;
          triggerProps.onBlur?.(event);
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
}

type RowActionTooltipProps = Omit<
  React.ComponentProps<typeof TooltipTrigger>,
  'asChild'
> & {
  label: React.ReactNode;
  side?: React.ComponentProps<typeof TooltipContent>['side'];
  children: React.ReactElement;
};

export { RowActionTooltip };
export type { RowActionTooltipProps };
