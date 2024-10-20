import { useDndMonitor, useDroppable, DragMoveEvent } from '@dnd-kit/core';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  StepLocationRelativeToParent,
  isNil,
} from '@activepieces/shared';
import { ApButtonData } from '../types';
import { useBuilderStateContext } from '../../../builder-hooks';
import { flowUtilConsts } from '../consts';
import { Handle, Position } from '@xyflow/react';

//TODO: re-add drag/drop zone for add button
const ApAddButton = React.memo((props: ApButtonData) => {
  const [isStepInsideDropZone, setIsStepInsideDropzone] = useState(false);
  const [activeDraggingStep, readonly] = useBuilderStateContext((state) => [
    state.activeDraggingStep,
    state.readonly,
  ]);
  if (
    props.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
  ) {
  }
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
          className={cn(
            'transition-all bg-primary/90  overflow-visible  rounded-xss',
            {
              'shadow-add-button': isStepInsideDropZone,
            },
          )}
        >
          <div
            className={cn('  rounded-xss box-content ')}
            ref={setNodeRef}
          ></div>
        </div>
      )}
      {!showDropIndicator && !readonly && (
        <PieceSelector
          operation={{
            type: FlowOperationType.ADD_ACTION,
            actionLocation: {
              parentStep: props.parentStepName,
              stepLocationRelativeToParent: props.stepLocationRelativeToParent,
              branchIndex:
                props.stepLocationRelativeToParent ===
                  StepLocationRelativeToParent.INSIDE_BRANCH ||
                props.stepLocationRelativeToParent ===
                  StepLocationRelativeToParent.INSIDE_FALSE_BRANCH ||
                props.stepLocationRelativeToParent ===
                  StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
                  ? props.branchIndex
                  : -1,
              branchName:
                props.stepLocationRelativeToParent ===
                  StepLocationRelativeToParent.INSIDE_BRANCH ||
                props.stepLocationRelativeToParent ===
                  StepLocationRelativeToParent.INSIDE_FALSE_BRANCH ||
                props.stepLocationRelativeToParent ===
                  StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
                  ? props.branchName
                  : '',
            },
          }}
          open={actionMenuOpen}
          onOpenChange={setActionMenuOpen}
        >
          <div
            className={cn('rounded-xss cursor-pointer transition-all', {
              'shadow-add-button': actionMenuOpen,
            })}
          >
            <div
              style={{
                width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                height: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
              }}
              className={cn(
                'bg-[#a6b1bf] rounded-xss cursor-pointer  flex items-center justify-center  transition-all duration-300 ease-in-out',
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
        </PieceSelector>
      )}
    </>
  );
});

ApAddButton.displayName = 'ApAddButton';
export { ApAddButton };
