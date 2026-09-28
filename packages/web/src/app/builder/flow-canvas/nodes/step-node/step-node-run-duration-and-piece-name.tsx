import { Timer02Icon } from '@hugeicons/core-free-icons';
import { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

const StepNodeRunDuration = ({ duration }: { duration: number }) => {
  return (
    <div className="text-xs text-gray-11 shrink-0 flex items-center gap-1">
      <HugeiconsIcon icon={Timer02Icon} className="size-3" />
      <span>{formatUtils.formatDuration(duration, true)}</span>
    </div>
  );
};

const StepNodeRunDurationAndPieceName = ({
  stepName,
  pieceDisplayName,
}: {
  stepName: string;
  pieceDisplayName: string;
}) => {
  const [run, loopIndexes, flowVersion, canvasOrientation] =
    useBuilderStateContext((state) => [
      state.run,
      state.loopsIndexes,
      state.flowVersion,
      state.canvasOrientation,
    ]);
  const isHorizontal = canvasOrientation === 'horizontal';
  const selectedStepOutput = useMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(stepName, loopIndexes, run.steps)
      : null;
  }, [run, stepName, loopIndexes, flowVersion.trigger]);

  return (
    <div
      className={cn('flex mt-0.5 w-full items-center', {
        'justify-between': !isHorizontal,
        'justify-center': isHorizontal,
      })}
    >
      <TextWithTooltip
        tooltipMessage={pieceDisplayName}
        key={pieceDisplayName + selectedStepOutput?.duration}
      >
        <div
          className={cn('text-xs text-gray-11 truncate grow shrink', {
            'w-full': !isHorizontal,
            'text-center': isHorizontal,
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
