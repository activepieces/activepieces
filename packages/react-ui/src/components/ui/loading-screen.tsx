import { cn } from '../../lib/utils';

import { LoadingSpinner } from './spinner';

type LoadingScreenProps = {
  brightSpinner?: boolean;
  mode?: 'fullscreen' | 'container';
};
export const LoadingScreen = ({
  brightSpinner = false,
  mode = 'fullscreen',
}: LoadingScreenProps) => {
  switch (mode) {
    case 'fullscreen':
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
    case 'container':
      return (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner
            className={cn({
              '!stroke-background': brightSpinner,
            })}
            size={50}
          />
        </div>
      );
  }
};
