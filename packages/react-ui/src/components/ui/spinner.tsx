import { cn } from '@/lib/utils';
import { LoaderIcon } from 'lucide-react';
import React from 'react';

export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const LoadingSpinner = React.memo(({ size = 24, className }: ISVGProps) => {
  return (
    <LoaderIcon
      className={cn('animate-spin stroke-foreground', className)}
      height={size}
      width={size}
    />
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
export { LoadingSpinner };
