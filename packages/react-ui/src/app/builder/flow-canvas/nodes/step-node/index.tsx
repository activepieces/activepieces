import { useDraggable } from '@dnd-kit/core';
import { Handle, NodeProps, Position } from '@xyflow/react';
import React, { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  Step,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';

import {
  flowUtilConsts,
  STEP_CONTEXT_MENU_ATTRIBUTE,
} from '../../utils/consts';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';
import { ApStepNode } from '../../utils/types';

import { StepInvalidOrSkippedIcon } from './step-invalid-or-skipped-icon';
import { StepNodeChevron } from './step-node-chevron';
import { StepNodeDisplayName } from './step-node-display-name';
import { StepNodeLogo } from './step-node-logo';
import { StepNodeName } from './step-node-name';
import { ApStepNodeStatus } from './step-node-status';
import { TriggerWidget } from './trigger-widget';

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
      isStepValid,
    ] = useBuilderStateContext((state) => [
      state.selectStepByName,
      state.selectedStep === step.name,
      state.activeDraggingStep === step.name,
      state.readonly,
      state.flowVersion,
      state.setSelectedBranchIndex,
      state.openedPieceSelectorStepNameOrAddButtonId === step.name,
      state.setOpenedPieceSelectorStepNameOrAddButtonId,
      flowStructureUtil.getStep(step.name, state.flowVersion.trigger)?.valid,
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
          'transition-all border-box rounded-md border border-solid border-border relative overflow-show  group',
          {
            'border-primary': isSelected,
            'bg-background': !isDragging,
            'border-none': isDragging,
            'shadow-none': isDragging,
            'bg-accent': isSkipped,
            'rounded-tl-none': isTrigger,
            'hover:border-ring': !isSelected,
          },
        )}
        onClick={(e) => handleStepClick(e)}
        key={step.name}
        ref={isPieceSelectorOpened ? null : setNodeRef}
        {...stepNodeDivAttributes}
        {...stepNodeDivListeners}
      >
        {isTrigger && <TriggerWidget isSelected={isSelected} />}
        <StepInvalidOrSkippedIcon
          isValid={!!isStepValid}
          isSkipped={isSkipped}
        />
        <ApStepNodeStatus stepName={step.name} />
        <StepNodeName stepName={step.name} />
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
                className="flex items-center justify-center h-full w-full gap-[10px]"
                onClick={(e) => {
                  if (!isPieceSelectorOpened) {
                    handleStepClick(e);
                  }
                }}
              >
                <StepNodeLogo
                  isSkipped={isSkipped}
                  logoUrl={stepMetadata?.logoUrl ?? ''}
                  displayName={stepMetadata?.displayName ?? ''}
                />
                <StepNodeDisplayName
                  stepDisplayName={step.displayName}
                  stepIndex={stepIndex}
                  isSkipped={isSkipped}
                  pieceDisplayName={stepMetadata?.displayName ?? ''}
                />
                {!readonly && <StepNodeChevron />}
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

function getPieceSelectorOperationType(step: Step) {
  if (flowStructureUtil.isTrigger(step.type)) {
    return FlowOperationType.UPDATE_TRIGGER;
  }
  return FlowOperationType.UPDATE_ACTION;
}
