import { useDraggable } from '@dnd-kit/core';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { ChevronDown } from 'lucide-react';
import React, { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  Step,
  TriggerType,
  flowStructureUtil,
} from '@activepieces/shared';

import { flowUtilConsts, STEP_CONTEXT_MENU_ATTRIBUTE } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApStepNode } from '../utils/types';

import { ApStepNodeStatus } from './step-node-status';

const getPieceSelectorOperationType = (step: Step) => {
  if (flowStructureUtil.isTrigger(step.type)) {
    return FlowOperationType.UPDATE_TRIGGER;
  }
  return FlowOperationType.UPDATE_ACTION;
};

const ApStepCanvasNode = React.memo(
  ({ data: { step } }: NodeProps & Omit<ApStepNode, 'position'>) => {
    const [
      selectStepByName,
      isSelected,
      isDragging,
      readonly,
      flowVersion,
      setSelectedBranchIndex,
      isPieceSelectorOpened,
      setOpenedPieceSelectorStepNameOrAddButtonId,
    ] = useBuilderStateContext((state) => [
      state.selectStepByName,
      state.selectedStep === step.name,
      state.activeDraggingStep === step.name,
      state.readonly,
      state.flowVersion,
      state.setSelectedBranchIndex,
      state.openedPieceSelectorStepNameOrAddButtonId === step.name,
      state.setOpenedPieceSelectorStepNameOrAddButtonId,
    ]);
    const { stepMetadata } = stepsHooks.useStepMetadata({
      step,
    });
    const stepIndex = useMemo(() => {
      const steps = flowStructureUtil.getAllSteps(flowVersion.trigger);
      return steps.findIndex((s) => s.name === step.name) + 1;
    }, [step, flowVersion]);
    const isTrigger = flowStructureUtil.isTrigger(step.type);
    const isSkipped = flowCanvasUtils.isSkipped(step.name, flowVersion.trigger);
    const { attributes, listeners, setNodeRef } = useDraggable({
      id: step.name,
      disabled: isTrigger || readonly,
      data: {
        type: flowUtilConsts.DRAGGED_STEP_TAG,
      },
    });

    const handleStepClick = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      selectStepByName(step.name);
      setSelectedBranchIndex(null);
      if (step.type === TriggerType.EMPTY) {
        setOpenedPieceSelectorStepNameOrAddButtonId(step.name);
      }
      e.preventDefault();
      e.stopPropagation();
    };
    const stepNodeDivAttributes = isPieceSelectorOpened ? {} : attributes;
    const stepNodeDivListeners = isPieceSelectorOpened ? {} : listeners;
    return (
      <div
        {...{ [`data-${STEP_CONTEXT_MENU_ATTRIBUTE}`]: step.name }}
        style={{
          height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
          width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
          maxWidth: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
        }}
       
        key={step.name}
        ref={isPieceSelectorOpened ? null : setNodeRef}
        {...stepNodeDivAttributes}
        {...stepNodeDivListeners}
      >
        {/* <div
          className="absolute left-full pl-3 text-accent-foreground text-sm opacity-0 transition-all duration-300 group-hover:opacity-100 "
          style={{
            top: `${flowUtilConsts.AP_NODE_SIZE.STEP.height / 2 - 12}px`,
          }}
        >
          {step.name}
        </div> */}
       
        <div className="px-3 relative h-full w-full cursor-default">
          {!isDragging && (
            <PieceSelector
              operation={{
                type: getPieceSelectorOperationType(step),
                stepName: step.name,
              }}
              id={step.name}
              openSelectorOnClick={false}
              stepToReplacePieceDisplayName={stepMetadata?.displayName}
            >
              <div
                className="flex items-center absolute cursor-pointer left-0  top-0 justify-center h-full w-full gap-3 bg-[var(--flow-bg)]"
                onClick={(e) => {
                  if (!isPieceSelectorOpened) {
                    handleStepClick(e);
                  }
                }}
 
              >
                <div className={cn('bg-background rounded-lg shadow-step-node border hover:border-primary/70 transition-all ', {
                      'border-primary/70 shadow-selected-step-node': isSelected,
                      'bg-background': !isDragging,
                      'border-none': isDragging,
                      'bg-accent/90 ': isSkipped,
                      'shadow-trigger-node border-[#94A3B8]': isTrigger && !isSelected,
                    })}>
                <div
                  className={cn(
                    'transition-all p-1.5 size-[60px] m-0.5  border-box rounded-md border border-solid border-border/75 relative  group',
                  )}
                >
                  <ImageWithFallback
                    src={stepMetadata?.logoUrl}
                    alt={stepMetadata?.displayName}
                    className="size-[48px]"
                  />
                </div>
                </div>
              
                <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
                  <div className=" flex items-center justify-between min-w-0 w-full">
                    <div
                      className={cn('text-sm truncate grow shrink')}
                    >
                      {stepIndex}. {step.displayName}
                    </div>

                    {/* {!readonly && (
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
                    )} */}
                  </div>

                  <div className="flex justify-between w-full items-center">
                    <div className="text-xs truncate text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full">
                      {stepMetadata?.displayName}
                    </div>
                    <ApStepNodeStatus stepName={step.name} />
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
              style={{...flowUtilConsts.HANDLE_STYLING,
                left: flowUtilConsts.HANDLES_LEFT_OFFSET + 'px', transform: `translateY(-${flowUtilConsts.HANDLES_LEFT_OFFSET}px,50%)`
              }}
            position={Position.Top}
          />
        </div>
     
      </div>
    );
  },
);

ApStepCanvasNode.displayName = 'ApStepCanvasNode';
export { ApStepCanvasNode };
