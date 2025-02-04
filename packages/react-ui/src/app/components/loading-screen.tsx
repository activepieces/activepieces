import { LoadingSpinner } from '../../components/ui/spinner';
import { cn } from '../../lib/utils';

export const LoadingScreen = ({
  useDarkBackground = false,
}: {
  useDarkBackground?: boolean;
}) => {
  return (
    <div
      className={cn('flex h-screen w-screen items-center justify-center ', {
        'bg-black/80': useDarkBackground,
      })}
    >
      <LoadingSpinner
        className={cn({
          'stroke-foreground': useDarkBackground,
        })}
        size={50}
      ></LoadingSpinner>
    </div>
  );
};
