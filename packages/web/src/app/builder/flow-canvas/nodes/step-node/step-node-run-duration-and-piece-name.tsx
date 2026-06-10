import { Timer } from 'lucide-react';
import { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

const StepNodeRunDuration = ({ duration }: { duration: number }) => {
  return (
    <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
      <Timer className="size-3" />
      <span>{formatUtils.formatDuration(duration, true)}</span>
    </div>
  );
};

const StepNodeRunDurationAndPieceName = ({
  stepName,
  pieceDisplayName,
  align = 'start',
}: {
  stepName: string;
  pieceDisplayName: string;
  align?: 'start' | 'center';
}) => {
  const [run, loopIndexes, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    state.flowVersion,
  ]);
  const selectedStepOutput = useMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(stepName, loopIndexes, run.steps)
      : null;
  }, [run, stepName, loopIndexes, flowVersion.trigger]);

  return (
    <div
      className={cn('flex mt-0.5 w-full items-center', {
        'justify-between': align === 'start',
        'justify-center': align === 'center',
      })}
    >
      <TextWithTooltip
        tooltipMessage={pieceDisplayName}
        key={pieceDisplayName + selectedStepOutput?.duration}
      >
        <div
          className={cn('text-xs text-muted-foreground truncate grow shrink', {
            'w-full': align === 'start',
            'text-center': align === 'center',
          })}
        >
          {pieceDisplayName}
        </div>
      </TextWithTooltip>
      {selectedStepOutput && (
        <StepNodeRunDuration duration={selectedStepOutput?.duration ?? 0} />
      )}
    </div>
  );
};
StepNodeRunDurationAndPieceName.displayName = 'StepNodeRunDurationAndPieceName';
export { StepNodeRunDurationAndPieceName };
