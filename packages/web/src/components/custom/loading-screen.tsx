import { LoadingSpinner } from '@/components/custom/spinner';
import { cn } from '@/lib/utils';

type LoadingScreenProps = {
  brightSpinner?: boolean;
  mode?: 'fullscreen' | 'container';
};
export const LoadingScreen = ({
  brightSpinner = false,
  mode = 'fullscreen',
}: LoadingScreenProps) => {
  return (
    <div
      className={cn('flex h-screen w-screen items-center justify-center', {
        'h-full w-full': mode === 'container',
      })}
    >
      <LoadingSpinner
        className={cn({
          'stroke-background!': brightSpinner,
        })}
        isLarge={true}
      ></LoadingSpinner>
    </div>
  );
};
