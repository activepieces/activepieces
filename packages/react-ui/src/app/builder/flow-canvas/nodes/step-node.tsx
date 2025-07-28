import { useDraggable } from '@dnd-kit/core';
import { Handle, NodeProps, Position } from '@xyflow/react';
import React, { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  PieceCategory,
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
    const isFlowControlStep = stepMetadata?.categories.includes(
      PieceCategory.FLOW_CONTROL,
    );
    const isAiStep =
      stepMetadata?.categories.includes(
        PieceCategory.ARTIFICIAL_INTELLIGENCE,
      ) || stepMetadata?.categories.includes(PieceCategory.UNIVERSAL_AI);

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
        <div className="relative h-full w-full cursor-default">
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
              <>
                <div
                  className="absolute left-[80px] flex flex-col gap-1 text-sm bg-flow-bg !cursor-pointer z-10"
                  onClick={handleStepClick}
                  style={{
                    maxWidth: `${flowUtilConsts.STEP_DISPLAY_META_WIDTH}px`,
                    top: `calc(50% - 20px)`,
                  }}
                >
                  <div className="truncate grow shrink  ">
                    {stepIndex}. {step.displayName}
                  </div>
                  <div className="text-muted-foreground break-keep text-nowrap truncate grow shrink">
                    {stepMetadata?.displayName}
                  </div>
                </div>
                <div
                  className=" items-center relative  cursor-pointer left-0  top-0 justify-center h-full w-full gap-3"
                  onClick={(e) => {
                    if (!isPieceSelectorOpened) {
                      handleStepClick(e);
                    }
                  }}
                >
                  <div
                    className={cn(
                      'bg-background relative rounded-lg shadow-step-node border hover:border-primary/70 transition-all ',
                      {
                        'border-primary/70 shadow-selected-step-node':
                          isSelected,
                        'shadow-trigger-node border-[#94A3B8]':
                          isTrigger && !isSelected,
                        'rounded-full': isFlowControlStep,
                        'bg-accent': isSkipped,
                      },
                    )}
                  >
                    {isAiStep && (
                      <div className="absolute size-[62px] top-[1px] left-[1px]  rounded-lg   backdrop-blur-2xl  bg-ai-gradient animate-rotate-gradient"></div>
                    )}

                    <div
                      className={cn(
                        'transition-all relative flex justify-center items-center size-[60px] m-0.5 bg-background  border-box rounded-md border border-solid border-border/75 relative  group',
                        {
                          'rounded-full': isFlowControlStep,
                          'bg-accent': isSkipped,
                          'size-[56px] m-1 border-transparent': isAiStep,
                        },
                      )}
                    >
                      <ImageWithFallback
                        src={stepMetadata?.logoUrl}
                        alt={stepMetadata?.displayName}
                        className={cn(
                          'size-[48px] min-w-[48px] min-h-[48px]  bg-background rounded-md object-contain',
                          {
                            'rounded-full': isFlowControlStep,
                          },
                        )}
                      />
                      <div className="absolute bottom-0 right-[5px]">
                        <ApStepNodeStatus stepName={step.name} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
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
