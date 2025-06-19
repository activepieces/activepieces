import { useDraggable } from '@dnd-kit/core';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { ChevronDown } from 'lucide-react';
import React, { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
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
  ({ data: {step} }: NodeProps & Omit<ApStepNode, 'position'>) => {
    const [
      selectStepByName,
      isSelected,
      isDragging,
      readonly,
      exitStepSettings,
      flowVersion,
      setSelectedBranchIndex,
      setPieceSelectorStep,
      pieceSelectorStep,
    ] = useBuilderStateContext((state) => [
      state.selectStepByName,
      state.selectedStep === step.name,
      state.activeDraggingStep === step.name,
      state.readonly,
      state.exitStepSettings,
      state.flowVersion,
      state.setSelectedBranchIndex,
      state.setPieceSelectorStep,
      state.pieceSelectorStep,
    ]);
    const openPieceSelector = pieceSelectorStep === step.name;
    const { stepMetadata } = piecesHooks.useStepMetadata({
      step,
    });

    const stepIndex = useMemo(() => {
      const steps = flowStructureUtil.getAllSteps(flowVersion.trigger);
      return steps.findIndex((s) => s.name === step.name) + 1;
    }, [step, flowVersion]);

    const isTrigger = flowStructureUtil.isTrigger(step.type);

    const isEmptyTriggerSelected = step.type === TriggerType.EMPTY;
    const isSkipped = flowCanvasUtils.isSkipped(step.name, flowVersion.trigger);

    const { attributes, listeners, setNodeRef } = useDraggable({
      id: step.name,
      disabled: isTrigger || readonly,
      data: {
        type: flowUtilConsts.DRAGGED_STEP_TAG,
      },
    });

    const initialSelectedPieceDisplayName = isEmptyTriggerSelected
      ? undefined
      : stepMetadata?.displayName;
    const handleStepClick = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      selectStepByName(step.name);
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
              initialSelectedPieceDisplayName={initialSelectedPieceDisplayName}
              operation={{
                type: getPieceSelectorOperationType(step),
                stepName: step.name,
              }}
              open={openPieceSelector || isEmptyTriggerSelected}
              onOpenChange={(open) => {
                setPieceSelectorStep(open ? step.name : null);
                if (!open && isEmptyTriggerSelected) {
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
                        logoUrl={
                          step.settings?.inputUiInfo?.customizedInputs
                            ?.logoUrl ?? stepMetadata?.logoUrl
                        }
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
                      <ApStepNodeStatus step={step} />
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
