import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { LogoPlate } from '@/components/custom/logo-plate';
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
      className={cn('flex shrink-0 items-center justify-center', {
        'opacity-80': isSkipped,
      })}
    >
      <LogoPlate
        src={logoUrl}
        alt={displayName}
        className={cn('rounded-lg border-gray-6', {
          'size-9 p-2': !isHorizontal,
          'size-12 p-2.5': isHorizontal,
        })}
        border
      />
    </div>
  );
};

export { StepNodeLogo };
