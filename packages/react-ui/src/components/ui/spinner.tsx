import { LoaderIcon } from 'lucide-react';
import React from 'react';

export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const LoadingSpinner = React.memo(({ size = 24 }: ISVGProps) => {
  return (
    <div className="animate-spin">
      <LoaderIcon height={size} width={size}></LoaderIcon>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
export { LoadingSpinner };
