import { ImageWithColorBackground } from '@/components/custom/image-with-color-background';
import { cn } from '@/lib/utils';

const StepNodeLogo = ({
  isSkipped,
  logoUrl,
  displayName,
  size = 'default',
}: {
  isSkipped: boolean;
  logoUrl: string;
  displayName: string;
  size?: 'default' | 'lg';
}) => {
  return (
    <div
      className={cn('flex items-center justify-center rounded-sm shrink-0', {
        'opacity-80': isSkipped,
      })}
    >
      <ImageWithColorBackground
        src={logoUrl}
        alt={displayName}
        key={logoUrl + displayName}
        border={true}
        className={cn({
          'w-9 h-9 p-2': size === 'default',
          'w-12 h-12 p-2.5': size === 'lg',
        })}
        roundedCorner={true}
      />
    </div>
  );
};

export { StepNodeLogo };
