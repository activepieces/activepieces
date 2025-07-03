'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref,
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };

type HorizontalSeparatorWithTextProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};
const HorizontalSeparatorWithText = React.forwardRef<
  HTMLDivElement,
  HorizontalSeparatorWithTextProps
>(({ className, ...props }, ref) => (
  <div className={cn('flex w-full flex-row items-center', className)}>
    <div className="w-1/2 border" />
    <span className="mx-2 text-sm">{props.children}</span>
    <div className="w-1/2 border" />
  </div>
));

HorizontalSeparatorWithText.displayName = 'HorizontalSeparatorWithText';
export { HorizontalSeparatorWithText };
