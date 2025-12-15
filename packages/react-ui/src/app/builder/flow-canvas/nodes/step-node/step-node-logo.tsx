import ImageWithFallback from '@/components/ui/image-with-fallback';
import { cn } from '@/lib/utils';

const StepNodeLogo = ({
  isSkipped,
  logoUrl,
  displayName,
}: {
  isSkipped: boolean;
  logoUrl: string;
  displayName: string;
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center p-1.5 border-border border border-solid rounded-xl',
        {
          'opacity-80': isSkipped,
        },
      )}
    >
      <ImageWithFallback
        src={logoUrl}
        alt={displayName}
        key={logoUrl + displayName}
        className="w-[25px] h-[25px]"
      />
    </div>
  );
};

export { StepNodeLogo };

