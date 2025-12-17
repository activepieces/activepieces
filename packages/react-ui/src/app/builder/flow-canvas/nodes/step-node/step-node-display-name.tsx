import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

const StepNodeDisplayName = ({
  stepDisplayName,
  stepIndex,
  isSkipped,
  pieceDisplayName,
}: {
  stepDisplayName: string;
  stepIndex: number;
  isSkipped: boolean;
  pieceDisplayName: string;
}) => {
  return (
    <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
      <div className=" flex items-center justify-between min-w-0 w-full">
        <TextWithTooltip tooltipMessage={stepDisplayName}>
          <div
            className={cn('text-sm truncate grow shrink ', {
              'text-accent-foreground/70': isSkipped,
            })}
          >
            {stepIndex}. {stepDisplayName}
          </div>
        </TextWithTooltip>
      </div>
      <div className="flex justify-between mt-0.5 w-full items-center">
        <div className="text-xs text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full">
          {pieceDisplayName}
        </div>
      </div>
    </div>
  );
};

export { StepNodeDisplayName };
