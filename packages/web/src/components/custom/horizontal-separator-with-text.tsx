import * as React from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function HorizontalSeparatorWithText({
  className,
  children,
}: HorizontalSeparatorWithTextProps) {
  return (
    <div className={cn('flex w-full flex-row items-center gap-2', className)}>
      <Separator className="flex-1" />
      <span className="text-sm">{children}</span>
      <Separator className="flex-1" />
    </div>
  );
}

export { HorizontalSeparatorWithText };

type HorizontalSeparatorWithTextProps = {
  className?: string;
  children: React.ReactNode;
};
