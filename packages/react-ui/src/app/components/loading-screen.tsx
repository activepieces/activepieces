import { LoadingSpinner } from '@/components/ui/spinner';

import { cn } from '../../lib/utils';

export const LoadingScreen = ({
  brightSpinner = false,
}: {
  brightSpinner?: boolean;
}) => {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <LoadingSpinner
        className={cn({
          '!stroke-background': brightSpinner,
        })}
        size={50}
      ></LoadingSpinner>
    </div>
  );
};
