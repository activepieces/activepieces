import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

import { StepNodeRunDurationAndPieceName } from './step-node-run-duration-and-piece-name';

const StepNodeDisplayName = ({
  stepDisplayName,
  stepIndex,
  isSkipped,
  pieceDisplayName,
  stepName,
}: {
  stepDisplayName: string;
  stepIndex: number;
  isSkipped: boolean;
  pieceDisplayName: string;
  stepName: string;
}) => {
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const isHorizontal = canvasOrientation === 'horizontal';
  return (
    <div
      className={cn('grow flex flex-col justify-center min-w-0 w-full', {
        'items-start': !isHorizontal,
        'items-center': isHorizontal,
      })}
    >
      <div
        className={cn('flex items-center min-w-0 w-full', {
          'justify-between': !isHorizontal,
          'justify-center': isHorizontal,
        })}
      >
        <TextWithTooltip tooltipMessage={stepDisplayName} key={stepDisplayName}>
          <div
            className={cn('text-sm truncate grow shrink ', {
              'text-accent-foreground/70': isSkipped,
              'text-center': isHorizontal,
            })}
          >
            {stepIndex}. {stepDisplayName}
          </div>
        </TextWithTooltip>
      </div>
      <StepNodeRunDurationAndPieceName
        stepName={stepName}
        pieceDisplayName={pieceDisplayName}
      />
    </div>
  );
};

export { StepNodeDisplayName };
