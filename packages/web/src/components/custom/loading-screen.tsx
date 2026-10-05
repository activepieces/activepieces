import { Spinner } from '@/components/ui/spinner';
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
      <Spinner
        className={cn('size-10 text-gray-11', {
          'text-gray-1': brightSpinner,
        })}
      />
    </div>
  );
};
