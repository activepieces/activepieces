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
import {
  Check,
  CircleAlert,
  Clock3,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
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

const RAIL_EXPANDED_STORAGE_KEY = 'ap.builder.runTimelineRailExpanded';

function readRailExpanded(): boolean {
  const stored = localStorage.getItem(RAIL_EXPANDED_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

const RunTimelineRail = () => {
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
  const [isExpanded, setIsExpanded] = useState(readRailExpanded);

  const timelineItems = useMemo(
    () =>
      buildTimelineItems({
        flowVersion,
        loopsIndexes,
        steps: run?.steps ?? {},
      }),
    [flowVersion, loopsIndexes, run?.steps],
  );

  const toggleExpanded = () => {
    setIsExpanded((value) => {
      const next = !value;
      localStorage.setItem(RAIL_EXPANDED_STORAGE_KEY, String(next));
      return next;
    });
  };

  if (!run || timelineItems.length === 0) {
    return null;
  }

  if (!isExpanded) {
    return (
      <div className="h-full shrink-0 border-r border-border flex flex-col items-center py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={toggleExpanded}
              aria-label={t('Steps')}
            >
              <PanelLeftOpen className="size-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('Steps')}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="h-full w-56 shrink-0 border-r border-border flex flex-col bg-background">
      <div className="flex items-center justify-between gap-2 px-2 py-2 shrink-0">
        <div className="flex min-w-0 items-center gap-2 pl-1">
          <span className="text-sm font-medium truncate">{t('Steps')}</span>
          <span className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
            {timelineItems.length}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={toggleExpanded}
              aria-label={t('Collapse')}
            >
              <PanelLeftClose className="size-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Collapse')}</TooltipContent>
        </Tooltip>
      </div>
      <ScrollArea className="flex-1 min-h-0 border-t border-border">
        <div className="flex flex-col gap-0.5 p-1.5">
          {timelineItems.map((item, index) => (
            <TimelineStepRow
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
    </div>
  );
};

const TimelineStepRow = ({
  isSelected,
  item,
  onSelectIteration,
  onSelectStep,
  order,
}: TimelineStepRowProps) => (
  <div
    className={cn(
      'rounded-md border border-transparent',
      isSelected && 'border-primary/30 bg-primary/5',
    )}
  >
    <button
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
      onClick={onSelectStep}
      type="button"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
        {order}
      </span>
      <StepStatusIcon
        hideTooltip
        size="4"
        status={item.output?.status ?? StepOutputStatus.RUNNING}
      />
      <div className="min-w-0 flex-1">
        <TextWithTooltip tooltipMessage={item.step.displayName}>
          <div className="truncate text-sm font-medium">
            {item.step.displayName}
          </div>
        </TextWithTooltip>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3 shrink-0" />
          {formatDuration(item.output?.duration)}
        </div>
      </div>
    </button>
    {item.iterations.length > 0 && (
      <div className="flex flex-wrap gap-1 px-2 pb-2 pl-9">
        {item.iterations.map((iteration) => (
          <Tooltip key={iteration.index}>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  'size-6 rounded-full p-0 text-[11px]',
                  getIterationButtonClassName(iteration.status),
                  iteration.isSelected && 'ring-2 ring-primary ring-offset-1',
                )}
                onClick={() => onSelectIteration(iteration.index)}
                size="icon"
                variant="outline"
              >
                <IterationStatusContent status={iteration.status} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {`${t('Iteration {index}', {
                index: iteration.index + 1,
              })} · ${getIterationStatusLabel(iteration.status)}`}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    )}
  </div>
);

const IterationStatusContent = ({ status }: { status: StepOutputStatus }) => {
  switch (status) {
    case StepOutputStatus.FAILED:
      return <CircleAlert className="size-3" />;
    case StepOutputStatus.RUNNING:
      return <LoaderCircle className="size-3 animate-spin" />;
    case StepOutputStatus.PAUSED:
      return <Pause className="size-3" />;
    default:
      return <Check className="size-3" />;
  }
};

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

  return output.output.iterations.map((iteration, index) => ({
    index,
    isSelected: loopIndex === index,
    status: getIterationStatus(iteration),
  }));
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

function getIterationButtonClassName(status: StepOutputStatus): string {
  switch (status) {
    case StepOutputStatus.FAILED:
      return 'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground';
    case StepOutputStatus.RUNNING:
      return 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary';
    case StepOutputStatus.PAUSED:
      return 'border-warning/40 bg-warning/5 text-warning hover:bg-warning/10 hover:text-warning';
    default:
      return 'border-success/40 bg-success/5 text-success hover:bg-success/10 hover:text-success';
  }
}

function formatDuration(duration: number | undefined): string {
  if (duration === undefined) {
    return '—';
  }
  return formatUtils.formatDuration(duration, false);
}

function isLoopStepOutput(output: StepOutput): output is LoopStepOutput {
  return output.type === FlowActionType.LOOP_ON_ITEMS;
}

RunTimelineRail.displayName = 'RunTimelineRail';
export { RunTimelineRail };

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
  isSelected: boolean;
  status: StepOutputStatus;
};

type TimelineStepRowProps = {
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
