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
  FlowTriggerType,
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
      if (step.type === FlowTriggerType.EMPTY) {
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
        className={cn(
          'transition-all border-box rounded-sm border border-solid border-border relative hover:border-primary/70 group',
          {
            'border-primary/70': isSelected,
            'bg-background': !isDragging,
            'border-none': isDragging,
            'shadow-none': isDragging,
            'bg-accent/90': isSkipped,
          },
        )}
        onClick={(e) => handleStepClick(e)}
        key={step.name}
        ref={isPieceSelectorOpened ? null : setNodeRef}
        {...stepNodeDivAttributes}
        {...stepNodeDivListeners}
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
              'border-t-[2px] border-primary/70 border-solid':
                isSelected && !isDragging,
            },
          )}
        ></div>
        <div className="px-3 h-full w-full overflow-hidden">
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
                className="flex items-center justify-center h-full w-full gap-3"
                onClick={(e) => {
                  if (!isPieceSelectorOpened) {
                    handleStepClick(e);
                  }
                }}
              >
                <div
                  className={cn('flex items-center justify-center h-full ', {
                    'opacity-80': isSkipped,
                  })}
                >
                  <ImageWithFallback
                    src={stepMetadata?.logoUrl}
                    alt={stepMetadata?.displayName}
                    className="w-12 h-12"
                  />
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
