import { LoaderCircle } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  isLarge?: boolean;
}
/**When editing the size of the spinner use size class */
const LoadingSpinner = React.memo(
  ({ className, isLarge = false }: ISVGProps) => {
    return (
      <LoaderCircle
        className={cn(
          'animate-spin  duration-1500 stroke-foreground size-5',
          {
            'size-[24px]': !isLarge,
            'size-[50px]': isLarge,
          },
          className,
        )}
      />
    );
  },
);

LoadingSpinner.displayName = 'LoadingSpinner';
export { LoadingSpinner };
