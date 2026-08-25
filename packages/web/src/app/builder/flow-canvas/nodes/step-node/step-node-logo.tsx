import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ImageWithColorBackground } from '@/components/custom/image-with-color-background';
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
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const isHorizontal = canvasOrientation === 'horizontal';
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
          'w-9 h-9 p-2': !isHorizontal,
          'w-12 h-12 p-2.5': isHorizontal,
        })}
        roundedCorner={true}
      />
    </div>
  );
};

export { StepNodeLogo };
