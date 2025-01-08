import { useDraggable } from '@dnd-kit/core';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { t } from 'i18next';
import { ChevronDown, RouteOff } from 'lucide-react';
import React, { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import { InvalidStepIcon } from '@/components/custom/alert-icon';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn } from '@/lib/utils';
import {
  Action,
  ActionType,
  FlowOperationType,
  FlowRun,
  FlowRunStatus,
  FlowVersion,
  Trigger,
  TriggerType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { StepStatusIcon } from '../../../../features/flow-runs/components/step-status-icon';
import { flowUtilConsts, STEP_CONTEXT_MENU_ATTRIBUTE } from '../utils/consts';
import { ApStepNode } from '../utils/types';

function hasSkippedParent(stepName: string, trigger: Trigger): boolean {
  const step = flowStructureUtil.getStep(stepName, trigger);
  if (!step) {
    return false;
  }

  const skippedParents = flowStructureUtil
    .findPathToStep(trigger, stepName)
    .filter(
      (p) =>
        (p.type === ActionType.LOOP_ON_ITEMS || p.type === ActionType.ROUTER) &&
        flowStructureUtil.isChildOf(p, stepName) &&
        p.skip,
    );
  return skippedParents.length > 0;
}

function getStepStatus(
  stepName: string | undefined,
  run: FlowRun | null,
  loopIndexes: Record<string, number>,
  flowVersion: FlowVersion,
) {
  if (!run || !stepName || !run.steps) {
    return undefined;
  }
  const stepOutput = flowRunUtils.extractStepOutput(
    stepName,
    loopIndexes,
    run.steps,
    flowVersion.trigger,
  );
  return stepOutput?.status;
}

const StepActionWrapper = React.memo(
  ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="flex items-center gap-2 cursor-pointer">{children}</div>
    );
  },
);

StepActionWrapper.displayName = 'StepActionWrapper';
const ApStepCanvasNode = React.memo(
  ({ data }: NodeProps & Omit<ApStepNode, 'position'>) => {
    const [
      selectStepByName,
      setAllowCanvasPanning,
      isSelected,
      isDragging,
      selectedStep,
      run,
      readonly,
      exitStepSettings,
      flowVersion,
      loopIndexes,
      setSelectedBranchIndex,
      setPieceSelectorStep,
      pieceSelectorStep,
    ] = useBuilderStateContext((state) => [
      state.selectStepByName,
      state.setAllowCanvasPanning,
      !isNil(state.selectedStep) && state.selectedStep === data.step?.name,
      state.activeDraggingStep === data.step?.name,
      state.selectedStep,
      state.run,
      state.readonly,
      state.exitStepSettings,
      state.flowVersion,
      state.loopsIndexes,
      state.setSelectedBranchIndex,
      state.setPieceSelectorStep,
      state.pieceSelectorStep,
    ]);
    const openPieceSelector = pieceSelectorStep === data.step!.name;
    const step =
      flowStructureUtil.getStep(data.step!.name, flowVersion.trigger) ||
      data.step!;
    const { stepMetadata } = piecesHooks.useStepMetadata({
      step,
    });

    const stepIndex = useMemo(() => {
      const steps = flowStructureUtil.getAllSteps(flowVersion.trigger);
      return steps.findIndex((s) => s.name === step.name) + 1;
    }, [data, flowVersion]);

    const isTrigger = flowStructureUtil.isTrigger(step.type);
    const isAction = flowStructureUtil.isAction(step.type);

    const pieceSelectorOperation = isAction
      ? FlowOperationType.UPDATE_ACTION
      : FlowOperationType.UPDATE_TRIGGER;
    const isEmptyTriggerSelected =
      selectedStep === 'trigger' && step.type === TriggerType.EMPTY;
    const isSkipped = (step as Action).skip;

    const { attributes, listeners, setNodeRef } = useDraggable({
      id: step.name,
      disabled: isTrigger || readonly,
      data: {
        type: flowUtilConsts.DRAGGED_STEP_TAG,
      },
    });

    const stepOutputStatus = useMemo(() => {
      return getStepStatus(step.name, run, loopIndexes, flowVersion);
    }, [step.name, run, loopIndexes, flowVersion]);

    const showRunningIcon =
      isNil(stepOutputStatus) &&
      run?.status === FlowRunStatus.RUNNING &&
      !hasSkippedParent(step.name, flowVersion.trigger) &&
      !isSkipped;

    const handleStepClick = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      const { name } = data.step!;
      selectStepByName(name);
      setSelectedBranchIndex(null);
      e.preventDefault();
      e.stopPropagation();
    };
    return (
      <div
        {...{ [`data-${STEP_CONTEXT_MENU_ATTRIBUTE}`]: step.name }}
        style={{
          height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
          width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
          maxWidth: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
        }}
        className={cn(
          'transition-all border-box rounded-sm border border-solid border-border relative hover:border-primary group',
          {
            'shadow-step-container': !isDragging,
            'border-primary': isSelected,
            'bg-background': !isDragging,
            'border-none': isDragging,
            'shadow-none': isDragging,
            'bg-accent/90': isSkipped,
          },
        )}
        onClick={(e) => handleStepClick(e)}
        onMouseEnter={() => {
          setAllowCanvasPanning(false);
        }}
        onMouseLeave={() => {
          setAllowCanvasPanning(true);
        }}
        key={step.name}
        ref={openPieceSelector ? null : setNodeRef}
        {...(!openPieceSelector ? attributes : {})}
        {...(!openPieceSelector ? listeners : {})}
      >
        <div
          className="absolute left-full pl-3 text-accent-foreground text-sm opacity-0 transition-all duration-300 group-hover:opacity-100 "
          style={{
            top: `${flowUtilConsts.AP_NODE_SIZE.STEP.height / 2 - 12}px`,
          }}
        >
          {step.name}
        </div>
        <div
          className={cn(
            'absolute left-0 top-0 pointer-events-none  rounded-sm w-full h-full',
            {
              'border-t-[3px] border-primary border-solid':
                isSelected && !isDragging,
            },
          )}
        ></div>
        <div className="px-3 h-full w-full  overflow-hidden">
          {!isDragging && (
            <PieceSelector
              initialSelectedPiece={
                step.type === TriggerType.EMPTY
                  ? undefined
                  : stepMetadata?.displayName
              }
              operation={{
                type: isEmptyTriggerSelected
                  ? FlowOperationType.UPDATE_TRIGGER
                  : pieceSelectorOperation,
                stepName: step.name,
              }}
              open={openPieceSelector || isEmptyTriggerSelected}
              onOpenChange={(open) => {
                setPieceSelectorStep(open ? step.name : null);
                if (!open && step.type === TriggerType.EMPTY) {
                  exitStepSettings();
                }
              }}
              asChild={true}
            >
              <div
                className="flex h-full w-full"
                onClick={(e) => {
                  if (!openPieceSelector) {
                    handleStepClick(e);
                  }
                }}
              >
                <div className="flex h-full items-center justify-between gap-3 w-full">
                  <div className="flex items-center justify-center min-w-[46px] h-full">
                    <div className={isSkipped ? 'opacity-80' : ''}>
                      <PieceIcon
                        logoUrl={stepMetadata?.logoUrl}
                        displayName={stepMetadata?.displayName}
                        showTooltip={false}
                        size={'lg'}
                      ></PieceIcon>
                    </div>
                  </div>
                  <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
                    <div className=" flex items-center justify-between min-w-0 w-full">
                      <div
                        className={cn('text-sm truncate grow shrink ', {
                          'text-accent-foreground/70': isSkipped,
                        })}
                      >
                        {stepIndex}. {step.displayName}
                      </div>

                      {(!readonly || !isTrigger) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 size-7 "
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (e.target) {
                              const rightClickEvent = new MouseEvent(
                                'contextmenu',
                                {
                                  bubbles: true,
                                  cancelable: true,
                                  view: window,
                                  button: 2,
                                  clientX: e.clientX,
                                  clientY: e.clientY,
                                },
                              );
                              e.target.dispatchEvent(rightClickEvent);
                            }
                          }}
                        >
                          <ChevronDown className="w-4 h-4 stroke-muted-foreground" />
                        </Button>
                      )}
                    </div>

                    <div className="flex justify-between w-full items-center">
                      <div className="text-xs truncate text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full">
                        {stepMetadata?.displayName}
                      </div>
                      <div className="w-4 flex mt-0.5 items-center justify-center h-[20px]">
                        {stepOutputStatus && (
                          <StepStatusIcon
                            status={stepOutputStatus}
                            size="4"
                          ></StepStatusIcon>
                        )}
                        {showRunningIcon && (
                          <LoadingSpinner className="w-4 h-4 "></LoadingSpinner>
                        )}
                        {isSkipped && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <RouteOff className="w-4 h-4"> </RouteOff>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {t('Skipped')}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {!step.valid && !isSkipped && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="mr-3">
                                <InvalidStepIcon
                                  size={16}
                                  viewBox="0 0 16 15"
                                  className="stroke-0 animate-fade"
                                ></InvalidStepIcon>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {t('Incomplete settings')}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PieceSelector>
          )}

          <Handle
            type="source"
            style={flowUtilConsts.HANDLE_STYLING}
            position={Position.Bottom}
          />
          <Handle
            type="target"
            style={flowUtilConsts.HANDLE_STYLING}
            position={Position.Top}
          />
        </div>
      </div>
    );
  },
);

ApStepCanvasNode.displayName = 'ApStepCanvasNode';
export { ApStepCanvasNode };
