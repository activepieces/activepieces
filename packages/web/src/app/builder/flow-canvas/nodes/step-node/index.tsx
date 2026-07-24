import {
  FlowOperationType,
  Step,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { useDraggable } from '@dnd-kit/core';
import { Handle, NodeProps, Position } from '@xyflow/react';
import React, { useMemo, useRef } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import { LoopIterationInput } from '@/app/builder/run-details/loop-iteration-input';
import { RightSideBarType } from '@/app/builder/types';
import { stepsHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { flowCanvasConsts } from '../../utils/consts';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';
import { ApStepNode } from '../../utils/types';

import { StepNodeChevron } from './step-node-chevron';
import { StepNodeDisplayName } from './step-node-display-name';
import { StepNodeLogo } from './step-node-logo';
import { ApStepNodeSkippedStatus } from './step-node-skipped-status';
import { ApStepNodeStatusInDraft } from './step-node-status-in-draft';
import { ApStepNodeStatusInRun } from './step-node-status-in-run';
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
      isRightSidebarOpen,
      canvasOrientation,
    ] = useBuilderStateContext((state) => [
      state.selectStepByName,
      state.selectedStep === step.name,
      state.activeDraggingStep === step.name,
      state.readonly,
      state.flowVersion,
      state.setSelectedBranchIndex,
      state.openedPieceSelectorStepNameOrAddButtonId === step.name,
      state.setOpenedPieceSelectorStepNameOrAddButtonId,
      state.rightSidebar !== RightSideBarType.NONE,
      state.canvasOrientation,
    ]);
    const isHorizontal = canvasOrientation === 'horizontal';
    const { stepMetadata } = stepsHooks.useStepMetadata({
      step,
    });
    const stepIndex = useMemo(
      () => flowStructureUtil.getStepNumber(flowVersion.trigger, step.name),
      [step, flowVersion],
    );
    const isTrigger = flowStructureUtil.isTrigger(step.type);
    const isSkipped = flowCanvasUtils.isSkipped(step.name, flowVersion.trigger);

    const { attributes, listeners, setNodeRef } = useDraggable({
      id: step.name,
      disabled: isTrigger || readonly,
      data: {
        type: flowCanvasConsts.DRAGGED_STEP_TAG,
      },
    });

    // Radix's Popover closes the piece selector on pointerdown (outside click detection)
    // before our own click handler runs, so isPieceSelectorOpened already reads false by
    // the time handleStepClick fires for that same click. Snapshotting it on pointerdown
    // (which always runs first) lets us tell "clicked to dismiss" apart from "clicked to open".
    const wasPieceSelectorOpenedRef = useRef(isPieceSelectorOpened);
    const handlePointerDown = () => {
      wasPieceSelectorOpenedRef.current = isPieceSelectorOpened;
    };

    const handleStepClick = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
      preventDefault = true,
    ) => {
      selectStepByName(step.name);
      setSelectedBranchIndex(null);
      if (step.type === FlowTriggerType.EMPTY) {
        setOpenedPieceSelectorStepNameOrAddButtonId(step.name);
      }
      if (preventDefault) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const handleContextMenu = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      selectStepByName(step.name, { preventPieceSelectorOpen: true });
      setSelectedBranchIndex(null);
      // The delayed re-dispatch below is untrusted; bail here so it can't schedule
      // another one. Without this, an empty trigger (whose rightSidebar never opens)
      // would re-dispatch itself every SIDEBAR_ANIMATION_DURATION forever.
      if (isRightSidebarOpen || !e.nativeEvent.isTrusted) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();

      // we need to delay the context menu to ensure the right sidebar is opened first
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      setTimeout(() => {
        const currentRect = target.getBoundingClientRect();
        const screenX = currentRect.left + relativeX;
        const screenY = currentRect.top + relativeY;
        const contextMenuEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: screenX,
          clientY: screenY,
          button: 2,
          buttons: 2,
        });
        target.dispatchEvent(contextMenuEvent);
      }, flowCanvasConsts.SIDEBAR_ANIMATION_DURATION + 50);
    };

    const stepNodeDivAttributes = isPieceSelectorOpened ? {} : attributes;
    const stepNodeDivListeners = isPieceSelectorOpened ? {} : listeners;

    return (
      <div
        {...{
          [`data-${flowCanvasConsts.STEP_CONTEXT_MENU_ATTRIBUTE}`]: step.name,
        }}
        style={{
          height: `${flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].height}px`,
          width: `${flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].width}px`,
          maxWidth: `${flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].width}px`,
        }}
        onContextMenu={(e) => handleContextMenu(e)}
        className={cn(
          'transition-all border-box rounded-md border border-solid border-border relative overflow-visible  group',
          {
            'border-primary': isSelected,
            'bg-background': !isDragging,
            'border-none': isDragging,
            'shadow-none': isDragging,
            'bg-accent': isSkipped,
            'rounded-tl-none': isTrigger && !isHorizontal,
            'hover:border-ring': !isSelected,
          },
        )}
        onPointerDown={handlePointerDown}
        onClick={(e) => {
          if (!wasPieceSelectorOpenedRef.current) {
            handleStepClick(e);
          }
        }}
        key={step.name}
        ref={isPieceSelectorOpened ? null : setNodeRef}
        {...stepNodeDivAttributes}
        {...stepNodeDivListeners}
      >
        {isTrigger && <TriggerWidget isSelected={isSelected} />}
        <LoopIterationInput stepName={step.name} />
        <ApStepNodeStatusInRun stepName={step.name} />
        <ApStepNodeSkippedStatus stepName={step.name} />
        <ApStepNodeStatusInDraft stepName={step.name} />
        <div
          className={cn('h-full w-full', {
            'px-3 overflow-hidden': !isHorizontal,
          })}
        >
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
              {isHorizontal ? (
                <div
                  className="flex items-center justify-center h-full w-full"
                  onClick={(e) => {
                    if (!wasPieceSelectorOpenedRef.current) {
                      handleStepClick(e);
                    }
                  }}
                >
                  <StepNodeLogo
                    isSkipped={isSkipped}
                    logoUrl={stepMetadata?.logoUrl ?? ''}
                    displayName={stepMetadata?.displayName ?? ''}
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-full w-full gap-[10px]"
                  onClick={(e) => {
                    if (!wasPieceSelectorOpenedRef.current) {
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
                    stepName={step.name}
                  />
                  {!readonly && <StepNodeChevron />}
                </div>
              )}
            </PieceSelector>
          )}
          {isHorizontal && (
            <div
              style={{
                width: `${flowCanvasConsts.HORIZONTAL_STEP_LABEL_WIDTH}px`,
              }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 flex justify-center pointer-events-none"
            >
              <div className="flex flex-col items-center min-w-0 pointer-events-auto">
                <StepNodeDisplayName
                  stepDisplayName={step.displayName}
                  stepIndex={stepIndex}
                  isSkipped={isSkipped}
                  pieceDisplayName={stepMetadata?.displayName ?? ''}
                  stepName={step.name}
                />
              </div>
            </div>
          )}
          {isHorizontal && !readonly && !isDragging && (
            <div className="absolute top-0 right-0  translate-x-[30px] z-10">
              <StepNodeChevron />
            </div>
          )}

          <Handle
            type="source"
            style={flowCanvasConsts.HANDLE_STYLING}
            position={isHorizontal ? Position.Right : Position.Bottom}
          />
          <Handle
            type="target"
            style={flowCanvasConsts.HANDLE_STYLING}
            position={isHorizontal ? Position.Left : Position.Top}
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
