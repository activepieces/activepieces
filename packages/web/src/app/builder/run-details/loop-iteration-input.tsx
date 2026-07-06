import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  StepOutput,
  StepOutputStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

const LoopIterationInput = ({ stepName }: { stepName: string }) => {
  const [setLoopIndex, currentIndex, run, flowVersion, loopsIndexes, stepType] =
    useBuilderStateContext((state) => [
      state.setLoopIndex,
      state.loopsIndexes[stepName] ?? 0,
      state.run,
      state.flowVersion,
      state.loopsIndexes,
      flowStructureUtil.getStep(stepName, state.flowVersion.trigger)?.type,
    ]);
  const stepOutput = useMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(stepName, loopsIndexes, run.steps)
      : null;
  }, [run, stepName, loopsIndexes, flowVersion.trigger]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Animation duration
      prevIndexRef.current = currentIndex;
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const iterationStatuses = useMemo<StepOutputStatus[]>(() => {
    if (
      !stepOutput ||
      stepOutput.type !== FlowActionType.LOOP_ON_ITEMS ||
      !stepOutput.output
    ) {
      return [];
    }
    return stepOutput.output.iterations.map(getIterationStatus);
  }, [stepOutput]);
  const totalIterations = iterationStatuses.length;

  function onChange(value: string) {
    const parsedValue = Math.max(
      1,
      Math.min(parseInt(value) ?? 1, totalIterations),
    );
    setLoopIndex(stepName, parsedValue - 1);
  }

  if (isNil(run) || stepType !== FlowActionType.LOOP_ON_ITEMS) {
    return <></>;
  }

  return (
    <div className="absolute -top-4 -left-[45px]">
      <div className="flex items-center justify-center flex-col gap-0.5">
        <LoopIterationInputButton
          onChange={onChange}
          isIncreasing={true}
          currentIndex={currentIndex}
        />
        <Tooltip>
          <TooltipTrigger>
            <Input
              ref={inputRef}
              className={`py-2 w-[35px] px-0 h-[35px] animate-in fade-in bg-background border-solid rounded-md text-center !text-xs transition-all duration-300 ease-in-out ${
                isAnimating ? 'border-2 border-primary' : 'border border-border'
              }`}
              type="number"
              value={currentIndex + 1}
              min={1}
              max={totalIterations}
              onClick={(e) => {
                if (e.button === 0) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onChange={(e) => {
                const value =
                  isNil(e.target.value) ||
                  e.target.value.length === 0 ||
                  e.target.value === 'e'
                    ? '1'
                    : e.target.value;
                onChange(value);
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="left">
            {t(
              'Show child steps output on round ({iteration}/{totalIterations})',
              { iteration: currentIndex + 1, totalIterations },
            )}
          </TooltipContent>
        </Tooltip>
        <LoopIterationInputButton
          onChange={onChange}
          isIncreasing={false}
          currentIndex={currentIndex}
        />
        {totalIterations > 1 && (
          <div className="mt-1 flex max-h-[120px] w-9 flex-wrap content-start justify-center gap-0.5 overflow-y-auto">
            {iterationStatuses.map((status, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t('Iteration {index}', { index: index + 1 })}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLoopIndex(stepName, index);
                    }}
                    className={cn(
                      'size-2.5 shrink-0 rounded-full border border-background transition-transform hover:scale-125',
                      getIterationDotClassName(status),
                      index === currentIndex &&
                        'ring-1 ring-primary ring-offset-1',
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="left">
                  {`${t('Iteration {index}', {
                    index: index + 1,
                  })} · ${getIterationStatusLabel(status)}`}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

LoopIterationInput.displayName = 'LoopIterationInput';
export { LoopIterationInput };

function getIterationStatus(
  iteration: Record<string, StepOutput>,
): StepOutputStatus {
  const statuses = Object.values(iteration).map(
    (stepOutput) => stepOutput.status,
  );
  if (statuses.includes(StepOutputStatus.FAILED)) {
    return StepOutputStatus.FAILED;
  }
  if (statuses.includes(StepOutputStatus.RUNNING)) {
    return StepOutputStatus.RUNNING;
  }
  if (statuses.includes(StepOutputStatus.PAUSED)) {
    return StepOutputStatus.PAUSED;
  }
  return StepOutputStatus.SUCCEEDED;
}

function getIterationDotClassName(status: StepOutputStatus): string {
  switch (status) {
    case StepOutputStatus.FAILED:
      return 'bg-destructive';
    case StepOutputStatus.RUNNING:
      return 'bg-primary animate-pulse';
    case StepOutputStatus.PAUSED:
      return 'bg-warning';
    default:
      return 'bg-success';
  }
}

function getIterationStatusLabel(status: StepOutputStatus): string {
  switch (status) {
    case StepOutputStatus.FAILED:
      return t('Failed');
    case StepOutputStatus.RUNNING:
      return t('Running');
    case StepOutputStatus.PAUSED:
      return t('Paused');
    case StepOutputStatus.STOPPED:
      return t('Stopped');
    default:
      return t('Succeeded');
  }
}

const LoopIterationInputButton = ({
  onChange,
  isIncreasing,
  currentIndex,
}: {
  onChange: (val: string) => void;
  isIncreasing: boolean;
  currentIndex: number;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange((currentIndex + (isIncreasing ? 2 : 0)).toString());
      }}
      className="hover:bg-builder-background size-6"
      size="icon"
    >
      {isIncreasing ? (
        <ChevronUp className="w-2 h-2"></ChevronUp>
      ) : (
        <ChevronDown className="w-2 h-2"></ChevronDown>
      )}
    </Button>
  );
};
