import {
  FlowActionType,
  FlowVersion,
  LoopStepOutput,
  Step,
  StepOutput,
  StepOutputStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronsUpDown, Clock3, MousePointer2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

function RunTimelinePanel() {
  const [
    flowVersion,
    loopsIndexes,
    run,
    selectedStep,
    selectStepByName,
    setLoopIndex,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.loopsIndexes,
    state.run,
    state.selectedStep,
    state.selectStepByName,
    state.setLoopIndex,
  ]);
  const [isExpanded, setIsExpanded] = useState(true);

  const timelineItems = useMemo(() => {
    return buildTimelineItems({
      flowVersion,
      loopsIndexes,
      steps: run?.steps ?? {},
    });
  }, [flowVersion, loopsIndexes, run?.steps]);

  if (!run || timelineItems.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <button
          className="flex min-w-0 items-center gap-2 text-sm font-medium"
          onClick={() => setIsExpanded((value) => !value)}
          type="button"
        >
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{t('Run timeline')}</span>
        </button>
        <span className="shrink-0 text-xs text-muted-foreground">
          {t('{{count}} steps', { count: timelineItems.length })}
        </span>
      </div>
      {isExpanded && (
        <ScrollArea className="max-h-64 border-t">
          <div className="space-y-1 p-2">
            {timelineItems.map((item, index) => (
              <TimelineStepButton
                item={item}
                isSelected={selectedStep === item.step.name}
                key={`${item.step.name}-${index}`}
                onSelectStep={() => selectStepByName(item.step.name)}
                onSelectIteration={(iterationIndex) => {
                  selectStepByName(item.step.name);
                  setLoopIndex(item.step.name, iterationIndex);
                }}
                order={index + 1}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function TimelineStepButton({
  isSelected,
  item,
  onSelectIteration,
  onSelectStep,
  order,
}: TimelineStepButtonProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-transparent',
        isSelected && 'border-primary/30 bg-primary/5',
      )}
    >
      <button
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
        onClick={onSelectStep}
        type="button"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
          {order}
        </span>
        <StepStatusIcon
          hideTooltip
          size="4"
          status={item.output?.status ?? StepOutputStatus.RUNNING}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {item.step.displayName}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="size-3" />
            {formatDuration(item.output?.duration)}
          </div>
        </div>
        {isSelected && <MousePointer2 className="size-4 text-primary" />}
      </button>
      {item.iterations.length > 0 && (
        <div className="flex flex-wrap gap-1 px-11 pb-2">
          {item.iterations.map((iteration) => (
            <Tooltip key={iteration.index}>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    'size-6 rounded-full p-0 text-[11px]',
                    iteration.isSelected && 'ring-2 ring-primary ring-offset-1',
                  )}
                  onClick={() => onSelectIteration(iteration.index)}
                  size="icon"
                  variant={iteration.isFailed ? 'destructive' : 'outline'}
                >
                  {iteration.status === StepOutputStatus.SUCCEEDED ? (
                    <Check className="size-3" />
                  ) : (
                    iteration.index + 1
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('Iteration {{index}}: {{status}}', {
                  index: iteration.index + 1,
                  status: iteration.status,
                })}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}

function buildTimelineItems({
  flowVersion,
  loopsIndexes,
  steps,
}: BuildTimelineItemsParams): TimelineItem[] {
  return flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .map((step) => {
      const output = flowRunUtils.extractStepOutput(
        step.name,
        loopsIndexes,
        steps,
      );
      return {
        iterations: getLoopIterations({
          loopIndex: loopsIndexes[step.name],
          output,
          step,
        }),
        output,
        step,
      };
    })
    .filter((item) => item.output || item.iterations.length > 0);
}

function getLoopIterations({
  loopIndex,
  output,
  step,
}: GetLoopIterationsParams): TimelineIteration[] {
  if (
    step.type !== FlowActionType.LOOP_ON_ITEMS ||
    !output ||
    !isLoopStepOutput(output) ||
    !output.output
  ) {
    return [];
  }

  return output.output.iterations.map((iteration, index) => {
    const iterationStatus = getIterationStatus(iteration);
    return {
      index,
      isFailed: iterationStatus === StepOutputStatus.FAILED,
      isSelected: loopIndex === index,
      status: iterationStatus,
    };
  });
}

function getIterationStatus(
  iteration: Record<string, StepOutput>,
): StepOutputStatus {
  if (hasStepWithStatus({ iteration, status: StepOutputStatus.FAILED })) {
    return StepOutputStatus.FAILED;
  }

  if (hasStepWithStatus({ iteration, status: StepOutputStatus.RUNNING })) {
    return StepOutputStatus.RUNNING;
  }

  if (hasStepWithStatus({ iteration, status: StepOutputStatus.PAUSED })) {
    return StepOutputStatus.PAUSED;
  }

  return StepOutputStatus.SUCCEEDED;
}

function hasStepWithStatus({
  iteration,
  status,
}: HasStepWithStatusParams): boolean {
  return Object.values(iteration).some(
    (stepOutput) => stepOutput.status === status,
  );
}

function formatDuration(duration: number | undefined): string {
  if (duration === undefined) {
    return t('Not available');
  }
  return formatUtils.formatDuration(duration, false);
}

function isLoopStepOutput(output: StepOutput): output is LoopStepOutput {
  return output.type === FlowActionType.LOOP_ON_ITEMS;
}

type BuildTimelineItemsParams = {
  flowVersion: FlowVersion;
  loopsIndexes: Record<string, number>;
  steps: Record<string, StepOutput>;
};

type GetLoopIterationsParams = {
  loopIndex: number | undefined;
  output: StepOutput | undefined;
  step: Step;
};

type TimelineItem = {
  iterations: TimelineIteration[];
  output: StepOutput | undefined;
  step: Step;
};

type TimelineIteration = {
  index: number;
  isFailed: boolean;
  isSelected: boolean;
  status: StepOutputStatus;
};

type TimelineStepButtonProps = {
  isSelected: boolean;
  item: TimelineItem;
  onSelectIteration: (iterationIndex: number) => void;
  onSelectStep: () => void;
  order: number;
};

type HasStepWithStatusParams = {
  iteration: Record<string, StepOutput>;
  status: StepOutputStatus;
};

export { RunTimelinePanel };
