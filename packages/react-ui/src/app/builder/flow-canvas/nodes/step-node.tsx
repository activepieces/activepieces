import { Handle, NodeProps, Position } from '@xyflow/react';
import React, { useMemo } from 'react';
import { useBuilderStateContext, useStepNodeAttributes } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  Step,
  TriggerType,
  flowStructureUtil,
} from '@activepieces/shared';

import { flowUtilConsts } from '../utils/consts';
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
      flowVersion,
      setSelectedBranchIndex,
      isPieceSelectorOpened,
      setOpenedPieceSelectorStepNameOrAddButtonId,
    ] = useBuilderStateContext((state) => [
      state.selectStepByName,
      state.selectedStep === step.name,
      state.activeDraggingStep === step.name,
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
    const isRoundedStep = flowCanvasUtils.isRoundedNode(step.type);
    const hasGradientBorder = flowCanvasUtils.isAiNode(
      stepMetadata?.categories || [],
    );
    const stepNodeAttributes = useStepNodeAttributes(step);
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

    return (
      <div
        key={step.name}
        {...stepNodeAttributes}
        className=''
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
              <div>
               
              <div 
                  style={{
                   height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
                   width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                   maxWidth: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                 }}
                 className={cn('opacity-0 transition-all absolute left-0 top-0 rounded-md' ,{
                  'blur-2xl bg-ai-transparent-gradient opacity-75': hasGradientBorder,
                  'opacity-100': isSelected,
                 })}
                 >
                   
                 </div>
               
                <div
                  className="absolute left-[80px] flex flex-col gap-1 text-sm  !cursor-pointer z-10"
                  onClick={handleStepClick}
                  style={{
                    maxWidth: `${flowUtilConsts.STEP_DISPLAY_META_WIDTH}px`,
                    // 18px is the height of the text
                    top: `calc(50% - 18px)`,
                  }}
                >
                  <div className="truncate grow shrink bg-flow-bg/50">
                    {stepIndex}. {step.displayName}
                  </div>
                  <div className="text-muted-foreground break-keep text-nowrap truncate grow shrink bg-flow-bg/50">
                    {stepMetadata?.displayName}
                  </div>
                </div>


                <div
                  className={cn("items-center relative  cursor-pointer left-0  top-0 justify-center h-full w-full gap-3",{
                  })}
                  onClick={(e) => {
                    if (!isPieceSelectorOpened) {
                      handleStepClick(e);
                    }
                  }}
                >
                  <div
                    className={cn(
                      'bg-background flex items-center justify-center rounded-lg shadow-step-node border hover:border-primary transition-all  ',
                      {
                        'border-primary shadow-selected-step-node dark:shadow-selected-step-node-dark':
                          isSelected,
                        'shadow-trigger-node border-slate-400':
                          isTrigger && !isSelected,
                        'rounded-full': isRoundedStep,
                        'bg-accent': isSkipped,
                      },
                    )}
                    style={{
                      height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
                      width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                      maxWidth: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                    }}
                  >
                    <div className="relative">
                      {hasGradientBorder && (
                        <div className="absolute size-[60px] top-[2px] left-[2px]  backdrop-blur-2xl   rounded-md bg-ai-gradient animate-rotate-gradient"></div>
                      )}

                      <div
                        className={cn(
                          'transition-all relative flex justify-center items-center size-[60px] m-0.5 bg-white  border-box rounded-md border border-solid border-border/75',
                          {
                            'rounded-full': isRoundedStep,
                            'm-1 border-transparent rounded-sm size-[56px]  p-[4px] bg-white': hasGradientBorder,
                            'bg-accent dark:bg-gray-300': isSkipped,
                          },
                        )}
                      >
                        <ImageWithFallback
                          src={stepMetadata?.logoUrl}
                          alt={stepMetadata?.displayName}
                          className={cn(
                            'size-[52px] min-w-[52px] min-h-[52px] bg-white rounded-sm object-contain',
                            {
                              'rounded-full': isRoundedStep,
                              'bg-accent dark:bg-gray-300': isSkipped,
                            },
                          )}
                        />
                        <div
                          className={cn('absolute bottom-[2px] right-[2px]', {
                            'right-[3px] bottom-[3px]': isRoundedStep,
                            'right-[1px] bottom-0': hasGradientBorder,
                          })}
                        >
                          <ApStepNodeStatus stepName={step.name} />
                        </div>
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
