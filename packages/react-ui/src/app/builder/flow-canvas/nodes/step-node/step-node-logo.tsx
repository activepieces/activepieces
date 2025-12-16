import { ImageWithColorBackground } from '@/components/ui/image-with-color-background';
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
        'flex items-center justify-center p-1.5 border-border border border-solid rounded-md',
        {
          'opacity-80': isSkipped,
        },
      )}
    >
      <ImageWithColorBackground
        src={logoUrl}
        alt={displayName}
        key={logoUrl + displayName}
        className="w-9 h-9 p-2"
      />
    </div>
  );
};

export { StepNodeLogo };

