import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';
import React, { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { CardListItem } from '@/components/ui/card-list';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn, formatUtils } from '@/lib/utils';
import { ActionType, flowStructureUtil } from '@activepieces/shared';

import { StepStatusIcon } from '../../../features/flow-runs/components/step-status-icon';
import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import { flowCanvasUtils } from '../flow-canvas/utils/flow-canvas-utils';

import { LoopIterationInput } from './loop-iteration-input';
type FlowStepDetailsCardProps = {
  stepName: string;
  depth: number;
};

const FlowStepDetailsCardItem = ({
  stepName,
  depth,
}: FlowStepDetailsCardProps) => {
  const [
    loopsIndexes,
    step,
    selectedStep,
    stepIndex,
    selectStepByName,
    run,
    flowVersion,
  ] = useBuilderStateContext((state) => {
    const step = flowStructureUtil.getStepOrThrow(
      stepName,
      state.flowVersion.trigger,
    );
    const stepIndex = flowStructureUtil
      .getAllSteps(state.flowVersion.trigger)
      .findIndex((s) => s.name === stepName);

    return [
      state.loopsIndexes,
      step,
      state.selectedStep,
      stepIndex,
      state.selectStepByName,
      state.run,
      state.flowVersion,
    ];
  });
  const { fitView } = useReactFlow();
  const isChildSelected = useMemo(() => {
    return step?.type === ActionType.LOOP_ON_ITEMS && selectedStep
      ? flowStructureUtil.isChildOf(step, selectedStep)
      : false;
  }, [step, selectedStep]);

  const stepOutput = useMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(
          stepName,
          loopsIndexes,
          run.steps,
          flowVersion.trigger,
        )
      : null;
  }, [loopsIndexes, run, stepName, flowVersion.trigger]);

  const isStepSelected = selectedStep === stepName;

  const children =
    stepOutput &&
    stepOutput.output &&
    stepOutput.type === ActionType.LOOP_ON_ITEMS &&
    stepOutput.output.iterations[loopsIndexes[stepName]]
      ? Object.keys(stepOutput.output.iterations[loopsIndexes[stepName]])
      : [];
  const { stepMetadata } = piecesHooks.useStepMetadata({
    step: step,
  });
  const [isOpen, setIsOpen] = React.useState(true);

  const isLoopStep = stepOutput && stepOutput.type === ActionType.LOOP_ON_ITEMS;

  return (
    <Collapsible open={isOpen} className="w-full">
      <CollapsibleTrigger asChild={true}>
        <CardListItem
          onClick={() => {
            if (!isStepSelected) {
              selectStepByName(stepName);
              fitView(flowCanvasUtils.createFocusStepInGraphParams(stepName));
              setIsOpen(true);
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className={cn('cursor-pointer select-none px-4 py-3 h-14', {
            'bg-accent text-accent-foreground': isStepSelected,
          })}
        >
          <div
            style={{
              minWidth: `${depth * 25}px`,
              display: depth === 0 ? 'none' : 'flex',
            }}
          ></div>
          <div className="flex items-center  w-full gap-3">
            {children.length > 0 && (
              <Button
                variant="ghost"
                size={'icon'}
                className="w-4 h-4"
                onClick={(e) => {
                  setIsOpen(!isOpen);
                  e.stopPropagation();
                }}
              >
                <ChevronRight
                  size={16}
                  className={cn('', { 'rotate-90': isOpen })}
                />
              </Button>
            )}
            <img
              alt={stepMetadata?.displayName}
              className="w-6 h-6 object-contain"
              src={stepMetadata?.logoUrl}
            />
            <div className="break-all truncate min-w-0 grow-1 shrink-1">{`${
              stepIndex + 1
            }. ${step?.displayName}`}</div>
            <div className="w-2"></div>
            <div className="flex gap-1 justify-end  items-center flex-grow">
              {isLoopStep && isStepSelected && (
                <span className="text-sm font-semibold animate-fade">
                  {t('All Iterations')}
                </span>
              )}
              {isLoopStep && !isStepSelected && (
                <div
                  className={cn(
                    'flex gap-1 justify-end  items-center flex-grow',
                    {
                      hidden: !isChildSelected,
                    },
                  )}
                >
                  <LoopIterationInput stepName={stepName} />
                </div>
              )}
              {(!isLoopStep ||
                (isLoopStep && !isChildSelected && !isStepSelected)) && (
                <div className="flex gap-1 animate-fade">
                  <span className="text-muted-foreground text-xs break-normal whitespace-nowrap">
                    {formatUtils.formatDuration(
                      stepOutput?.duration ?? 0,
                      true,
                    )}
                  </span>
                  {stepOutput && stepOutput.status && (
                    <StepStatusIcon
                      status={stepOutput.status}
                      size="4"
                    ></StepStatusIcon>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardListItem>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-0">
        {children.map((stepName) => (
          <FlowStepDetailsCardItem
            stepName={stepName}
            key={stepName}
            depth={depth + 1}
          ></FlowStepDetailsCardItem>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

FlowStepDetailsCardItem.displayName = 'FlowStepDetailsCard';
export { FlowStepDetailsCardItem };
