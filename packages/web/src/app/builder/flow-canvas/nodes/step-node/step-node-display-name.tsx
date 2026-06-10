import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

import { StepNodeRunDurationAndPieceName } from './step-node-run-duration-and-piece-name';

const StepNodeDisplayName = ({
  stepDisplayName,
  stepIndex,
  isSkipped,
  pieceDisplayName,
  stepName,
  align = 'start',
}: {
  stepDisplayName: string;
  stepIndex: number;
  isSkipped: boolean;
  pieceDisplayName: string;
  stepName: string;
  align?: 'start' | 'center';
}) => {
  return (
    <div
      className={cn('grow flex flex-col justify-center min-w-0 w-full', {
        'items-start': align === 'start',
        'items-center': align === 'center',
      })}
    >
      <div
        className={cn('flex items-center min-w-0 w-full', {
          'justify-between': align === 'start',
          'justify-center': align === 'center',
        })}
      >
        <TextWithTooltip tooltipMessage={stepDisplayName} key={stepDisplayName}>
          <div
            className={cn('text-sm truncate grow shrink ', {
              'text-accent-foreground/70': isSkipped,
              'text-center': align === 'center',
            })}
          >
            {stepIndex}. {stepDisplayName}
          </div>
        </TextWithTooltip>
      </div>
      <StepNodeRunDurationAndPieceName
        stepName={stepName}
        pieceDisplayName={pieceDisplayName}
        align={align}
      />
    </div>
  );
};

export { StepNodeDisplayName };
