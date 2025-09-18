import { isNil } from '@activepieces/shared';
import { useDndMonitor, useDroppable, DragMoveEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowUtilConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApButtonData } from '../utils/types';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { cn } from '@/lib/utils';

const ApAddButton = React.memo((props: ApButtonData) => {
  const [isStepInsideDropZone, setIsStepInsideDropzone] = useState(false);
  const [activeDraggingStep, readonly, isPieceSelectorOpen] =
    useBuilderStateContext((state) => [
      state.activeDraggingStep,
      state.readonly,
      state.openedPieceSelectorStepNameOrAddButtonId === props.edgeId,
    ]);

  const { setNodeRef } = useDroppable({
    id: props.edgeId,
    data: {
      accepts: flowUtilConsts.DRAGGED_STEP_TAG,
      ...props,
    },
  });

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
          className={cn('transition-all bg-primary/90  rounded-xs', {
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
            className={cn(' absolute    rounded-xs box-content ')}
            ref={setNodeRef}
          ></div>
        </div>
      )}
      {!showDropIndicator && !readonly && (
        <PieceSelector
          operation={flowCanvasUtils.createAddOperationFromAddButtonData(props)}
          id={props.edgeId}
        >
          <div
            style={{
              width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
              height: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
            }}
          >
            <div
              style={{
                width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                height: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
              }}
              className={cn('rounded-xs cursor-pointer transition-all z-50', {
                'shadow-add-button': isPieceSelectorOpen,
              })}
            >
              <div
                style={{
                  width: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                  height: flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
                }}
                className={cn(
                  'bg-light-blue  relative group overflow-visible rounded-xs cursor-pointer  flex items-center justify-center  transition-all duration-300 ease-in-out',
                  {
                    'bg-primary ': isPieceSelectorOpen,
                  },
                )}
                data-testid="add-action-button"
              >
                {!isPieceSelectorOpen && (
                  <Plus className="w-3 h-3 stroke-[3px] text-white" />
                )}
              </div>
            </div>
          </div>
        </PieceSelector>
      )}
    </>
  );
});

ApAddButton.displayName = 'ApAddButton';
export { ApAddButton };
