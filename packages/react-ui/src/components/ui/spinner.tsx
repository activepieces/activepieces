import { LoaderIcon } from 'lucide-react';
import React from 'react';

export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const LoadingSpinner = React.memo(({ size = 24 }: ISVGProps) => {
  return <LoaderIcon className="animate-spin stroke-foreground"
   height={size} width={size} />;
});

LoadingSpinner.displayName = 'LoadingSpinner';
export { LoadingSpinner };
