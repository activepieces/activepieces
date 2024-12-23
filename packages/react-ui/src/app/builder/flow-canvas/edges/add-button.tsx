import { useDndMonitor, useDroppable, DragMoveEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  StepLocationRelativeToParent,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowUtilConsts } from '../utils/consts';
import { ApButtonData } from '../utils/types';

import { AskAiIndicator, shouldShowAskAiIndicator } from './ask-ai-indicator';

const ApAddButton = React.memo((props: ApButtonData) => {
  const [isStepInsideDropZone, setIsStepInsideDropzone] = useState(false);
  const [activeDraggingStep, readonly, showAskAiIndicator] =
    useBuilderStateContext((state) => [
      state.activeDraggingStep,
      state.readonly,
      shouldShowAskAiIndicator(state, props),
    ]);

  const { setNodeRef } = useDroppable({
    id: props.edgeId,
    data: {
      accepts: flowUtilConsts.DRAGGED_STEP_TAG,
      ...props,
    },
  });

  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const showDropIndicator = !isNil(activeDraggingStep);

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setIsStepInsideDropzone(event.collisions?.[0]?.id === props.edgeId);
    },
    onDragEnd() {
      setIsStepInsideDropzone(false);
    },
  });

  return (
    <>
      {showDropIndicator && !readonly && (
        <div
          style={{
            width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
            height: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
          }}
          className={cn('transition-all bg-primary/90  rounded-xss', {
            'shadow-add-button': isStepInsideDropZone,
          })}
        >
          <div
            style={{
              width: flowUtilConsts.AP_NODE_SIZE.STEP.width + 'px',
              height: flowUtilConsts.AP_NODE_SIZE.STEP.height + 'px',
              left: `${-flowUtilConsts.AP_NODE_SIZE.STEP.width / 2}px`,
              top: `${-flowUtilConsts.AP_NODE_SIZE.STEP.height / 2}px`,
            }}
            className={cn(' absolute    rounded-xss box-content ')}
            ref={setNodeRef}
          ></div>
        </div>
      )}
      {!showDropIndicator && !readonly && (
        <PieceSelector
          operation={
            props.stepLocationRelativeToParent ===
            StepLocationRelativeToParent.INSIDE_BRANCH
              ? {
                  type: FlowOperationType.ADD_ACTION,
                  actionLocation: {
                    parentStep: props.parentStepName,
                    stepLocationRelativeToParent:
                      props.stepLocationRelativeToParent,
                    branchIndex: props.branchIndex,
                  },
                }
              : {
                  type: FlowOperationType.ADD_ACTION,
                  actionLocation: {
                    parentStep: props.parentStepName,
                    stepLocationRelativeToParent:
                      props.stepLocationRelativeToParent,
                  },
                }
          }
          open={actionMenuOpen}
          onOpenChange={setActionMenuOpen}
          asChild={true}
        >
          <div
            style={{
              width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
              height: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
            }}
          >
            {showAskAiIndicator && (
              <AskAiIndicator
                height={flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height}
                width={flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width}
              ></AskAiIndicator>
            )}
            {!showAskAiIndicator && (
              <div
                style={{
                  width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                  height: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
                }}
                className={cn(
                  'rounded-xss cursor-pointer transition-all z-50',
                  {
                    'shadow-add-button': actionMenuOpen,
                  },
                )}
              >
                <div
                  style={{
                    width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                    height:
                      flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
                  }}
                  className={cn(
                    'bg-light-blue  relative group overflow-visible rounded-xss cursor-pointer  flex items-center justify-center  transition-all duration-300 ease-in-out',
                    {
                      'bg-primary ': actionMenuOpen,
                    },
                  )}
                >
                  {!actionMenuOpen && (
                    <Plus className="w-3 h-3 stroke-[3px] text-white" />
                  )}
                </div>
              </div>
            )}
          </div>
        </PieceSelector>
      )}
    </>
  );
});

ApAddButton.displayName = 'ApAddButton';
export { ApAddButton };
