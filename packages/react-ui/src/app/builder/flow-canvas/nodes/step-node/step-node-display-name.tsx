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
  return (
    <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
      <div className=" flex items-center justify-between min-w-0 w-full">
        <TextWithTooltip tooltipMessage={stepDisplayName} key={stepDisplayName}>
          <div
            className={cn('text-sm truncate grow shrink ', {
              'text-accent-foreground/70': isSkipped,
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
