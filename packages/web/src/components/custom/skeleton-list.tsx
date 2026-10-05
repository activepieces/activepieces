import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function SkeletonList({
  className,
  numberOfItems = 3,
  ...props
}: React.ComponentProps<'div'> & {
  numberOfItems?: number;
}) {
  const array = Array(numberOfItems).fill(null);
  return (
    <div className="space-y-3">
      {array.map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4 w-full', className)}
          {...props}
        />
      ))}
    </div>
  );
}

export { SkeletonList };
