import { flowHelper, isNil } from '@activepieces/shared';
import { useDndMonitor, useDroppable, DragMoveEvent } from '@dnd-kit/core';
import { BaseEdge } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { useBuilderStateContext } from '../../builder-hooks';
import {
  AP_NODE_SIZE,
  ApEdge,
  ApNodeType,
  DRAGGED_STEP_TAG,
  flowCanvasUtils,
} from '../flow-canvas-utils';

import { cn } from '@/lib/utils';

interface ApEdgeWithButtonProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data: ApEdge['data'];
}

const BUTTON_SIZE = {
  width: 16,
  height: 16,
};
function getEdgePath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: ApEdgeWithButtonProps) {
  const ARROW_DOWN = 'm6 -6 l-6 6 m-6 -6 l6 6';

  const targetYWithPlaceHolder =
    targetY +
    (flowCanvasUtils.isPlaceHolder(data.targetType)
      ? AP_NODE_SIZE[data.targetType].height + 10
      : 0);
  if (sourceX === targetX) {
    return {
      buttonPosition: {
        x: (targetX + sourceX) / 2 - BUTTON_SIZE.width / 2,
        y: (targetYWithPlaceHolder + sourceY) / 2 - BUTTON_SIZE.height / 2,
      },
      edgePath: `M ${sourceX} ${sourceY} v ${
        targetYWithPlaceHolder - sourceY
      } ${data.targetType === ApNodeType.STEP_NODE ? ARROW_DOWN : ''}`,
    };
  }
  const FIRST_LINE_LENGTH = 55;
  const ARC_LEFT = 'a15,15 0 0,0 -15,15';
  const ARC_RIGHT = 'a15,15 0 0,1 15,15';
  const ARC_LEFT_DOWN = 'a15,15 0 0,1 -15,15';
  const ARC_RIGHT_DOWN = 'a15,15 0 0,0 15,15';
  const ARC_LENGTH = 15;
  const SIGN = sourceX > targetX ? -1 : 1;
  return {
    buttonPosition: {
      x: targetX - BUTTON_SIZE.width / 2,
      y: targetYWithPlaceHolder - FIRST_LINE_LENGTH / 2 - 10,
    },
    edgePath: `M${sourceX} ${sourceY} 
    v${targetYWithPlaceHolder - sourceY - FIRST_LINE_LENGTH - ARC_LENGTH} ${
      SIGN < 0 ? ARC_LEFT_DOWN : ARC_RIGHT_DOWN
    }
    h${targetX - sourceX - 2 * SIGN * ARC_LENGTH} ${
      SIGN < 0 ? ARC_LEFT : ARC_RIGHT
    }
    v${FIRST_LINE_LENGTH - ARC_LENGTH}
    ${data.targetType === ApNodeType.STEP_NODE ? ARROW_DOWN : ''}`,
  };
}

const ApEdgeWithButton = React.memo((props: ApEdgeWithButtonProps) => {
  const [setIsStepInsideDropZone, setIsStepInsideDropzone] = useState(false);
  const [activeDraggingStep, clickOnNewNodeButton, selectedButton, readonly] =
    useBuilderStateContext((state) => [
      state.activeDraggingStep,
      state.clickOnNewNodeButton,
      state.selectedButton,
      state.readonly,
    ]);
  const { edgePath, buttonPosition } = getEdgePath(props);
  const { setNodeRef } = useDroppable({
    id: props.id,
    data: {
      accepts: DRAGGED_STEP_TAG,
      ...props.data,
    },
  });

  const showDropIndicator = !isNil(activeDraggingStep);
  const isSelected =
    selectedButton &&
    selectedButton.type === 'action' &&
    selectedButton?.stepname === props.data?.parentStep &&
    selectedButton?.relativeLocation ===
      props.data.stepLocationRelativeToParent;

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setIsStepInsideDropzone(event.collisions?.[0]?.id === props.id);
    },
    onDragEnd() {
      setIsStepInsideDropzone(false);
    },
  });

  return (
    <>
      <BaseEdge
        interactionWidth={0}
        path={edgePath}
        style={{ strokeWidth: 1.5 }}
      />
      {showDropIndicator && props.data?.addButton && !readonly && (
        <foreignObject
          width={AP_NODE_SIZE.smallButton.width}
          height={AP_NODE_SIZE.smallButton.height}
          x={buttonPosition.x}
          y={buttonPosition.y}
          className="transition-all overflow-visible relative"
          style={{
            borderRadius: '2px',
            boxShadow: setIsStepInsideDropZone
              ? '0 0 0 6px hsl(var(--primary-100))'
              : 'none',
          }}
        >
          <div
            style={{
              height: `${AP_NODE_SIZE.stepNode.height}px`,
              width: `${AP_NODE_SIZE.stepNode.width}px`,
              left: `-${
                AP_NODE_SIZE.stepNode.width / 2 -
                AP_NODE_SIZE.smallButton.height / 2
              }px`,
              top: `-${
                AP_NODE_SIZE.stepNode.height / 2 -
                AP_NODE_SIZE.smallButton.width / 2
              }px`,
            }}
            className="absolute"
            ref={setNodeRef}
          >
            {' '}
          </div>
          <div
            className={cn(
              'bg-primary w-[18px] h-[18px] rounded-[3px] box-content opacity-90',
            )}
          ></div>
        </foreignObject>
      )}
      {!showDropIndicator && props.data?.addButton && !readonly && (
        <foreignObject
          width={18}
          height={18}
          x={buttonPosition.x}
          y={buttonPosition.y}
          style={{
            borderRadius: '2px',
            boxShadow: isSelected
              ? '0 0 0 6px hsl(var(--primary-100))'
              : 'none',
          }}
          onClick={() =>
            clickOnNewNodeButton(
              'action',
              props.data.parentStep!,
              props.data.stepLocationRelativeToParent,
            )
          }
        >
          <div
            className={cn(
              'bg-[#a6b1bf] w-[18px] h-[18px] flex items-center justify-center  transition-all duration-300 ease-in-out',
              {
                'bg-primary ': isSelected,
              },
            )}
          >
            {!isSelected && <Plus className="w-3 h-3 text-white" />}
          </div>
        </foreignObject>
      )}
    </>
  );
});

ApEdgeWithButton.displayName = 'ApEdgeWithButton';
export { ApEdgeWithButton };
