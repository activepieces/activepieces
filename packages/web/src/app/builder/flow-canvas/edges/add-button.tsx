import { isNil } from '@activepieces/shared';
import { useDndMonitor, useDroppable, DragMoveEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApButtonData } from '../utils/types';

const ApAddButton = React.memo((props: ApButtonData) => {
  const [isStepInsideDropZone, setIsStepInsideDropzone] = useState(false);
  const [activeDraggingStep, readonly, isPieceSelectorOpen, canvasOrientation] =
    useBuilderStateContext((state) => [
      state.activeDraggingStep,
      state.readonly,
      state.openedPieceSelectorStepNameOrAddButtonId === props.edgeId,
      state.canvasOrientation,
    ]);
  const isHorizontal = canvasOrientation === 'horizontal';

  const { setNodeRef } = useDroppable({
    id: props.edgeId,
    data: {
      accepts: flowCanvasConsts.DRAGGED_STEP_TAG,
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
            width: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
            height: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
          }}
          className={cn('transition-all bg-primary/90  rounded-md', {
            'shadow-add-button': isStepInsideDropZone,
          })}
        >
          <div
            style={{
              width:
                flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].width + 'px',
              height:
                flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].height +
                'px',
              left: isHorizontal
                ? `${
                    -flowCanvasConsts.ORIENTATION_LAYOUT.horizontal
                      .spaceAlongBetweenSteps / 2
                  }px`
                : `${
                    -flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].width /
                    2
                  }px`,
              top: isHorizontal
                ? `${
                    -flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].height /
                    2
                  }px`
                : `${-flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS / 2}px`,
            }}
            className={cn(' absolute    rounded-md box-content ')}
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
              width: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
              height: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
            }}
          >
            <div
              style={{
                width: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                height: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
              }}
              className={cn('rounded-md cursor-pointer transition-all z-50', {
                'shadow-add-button': isPieceSelectorOpen,
              })}
            >
              <div
                style={{
                  width: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                  height:
                    flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
                }}
                className={cn(
                  'bg-background  border border-border border-solid relative group overflow-visible rounded-md cursor-pointer  flex items-center justify-center  transition-all duration-300 ease-in-out',
                  {
                    'bg-primary border-primary': isPieceSelectorOpen,
                  },
                )}
                data-testid="add-action-button"
              >
                {!isPieceSelectorOpen && (
                  <Plus className="w-3 h-3 stroke-[3px] text-foreground" />
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
