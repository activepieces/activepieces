import { useEmbedding } from '../../components/embed-provider';
import { LoadingSpinner } from '../../components/ui/spinner';
import { cn } from '../../lib/utils';

export const LoadingScreen = () => {
  const { embedState } = useEmbedding();
  const isInEmbedding =
    window.location.pathname.startsWith('/embed') || embedState.isEmbedded;
  return (
    <div
      className={cn('flex h-screen w-screen items-center justify-center ', {
        'black/80': isInEmbedding,
      })}
    >
      <LoadingSpinner
        className={cn({
          'stroke-background': isInEmbedding,
        })}
        size={50}
      ></LoadingSpinner>
    </div>
  );
};
