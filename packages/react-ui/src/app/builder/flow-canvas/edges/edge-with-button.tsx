import { useDndMonitor, useDroppable, DragMoveEvent } from '@dnd-kit/core';
import { BaseEdge } from '@xyflow/react';
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

import { useBuilderStateContext } from '../../builder-hooks';
import {
  AP_NODE_SIZE,
  ApEdge,
  ApNodeType,
  DRAGGED_STEP_TAG,
  flowCanvasUtils,
} from '../flow-canvas-utils';

interface ApEdgeWithButtonProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data: ApEdge['data'];
}
const LINE_WIDTH = 1.5;

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
  const [isStepInsideDropZone, setIsStepInsideDropzone] = useState(false);
  const [activeDraggingStep, readonly] = useBuilderStateContext((state) => [
    state.activeDraggingStep,
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

  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const showDropIndicator = !isNil(activeDraggingStep);

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setIsStepInsideDropzone(event.collisions?.[0]?.id === props.id);
    },
    onDragEnd() {
      setIsStepInsideDropzone(false);
    },
  });
  const labelDirectionSign =
    props.data.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
      ? -1
      : 1;
  return (
    <>
      <BaseEdge
        interactionWidth={0}
        path={edgePath}
        style={{ strokeWidth: `${LINE_WIDTH}px` }}
        className="cursor-default"
      />
      {(props.data.stepLocationRelativeToParent ===
        StepLocationRelativeToParent.INSIDE_FALSE_BRANCH ||
        props.data.stepLocationRelativeToParent ===
          StepLocationRelativeToParent.INSIDE_TRUE_BRANCH) && (
        <foreignObject
          width={
            props.data.stepLocationRelativeToParent ===
            StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
              ? 30
              : 35
          }
          height={25}
          className="z-50 relative pointer-events-none cursor-default"
          x={
            buttonPosition.x -
            (props.data.stepLocationRelativeToParent ===
            StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
              ? 100
              : 116) *
              labelDirectionSign
          }
          y={buttonPosition.y - 27}
        >
          <div className="text-accent-foreground text-sm text-center bg-background select-none cursor-default">
            {props.data.stepLocationRelativeToParent ===
            StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
              ? t('True')
              : t('False')}
          </div>
        </foreignObject>
      )}
      {showDropIndicator && props.data?.addButton && !readonly && (
        <foreignObject
          width={AP_NODE_SIZE.smallButton.width}
          height={AP_NODE_SIZE.smallButton.height}
          x={buttonPosition.x - LINE_WIDTH / 2}
          y={buttonPosition.y}
          className={cn(
            'transition-all overflow-visible relative rounded-xss',
            {
              'shadow-add-button': isStepInsideDropZone,
            },
          )}
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
          ></div>
          <div
            className={cn(
              'bg-primary/90 w-[18px] h-[18px] rounded-xss box-content ',
            )}
          ></div>
        </foreignObject>
      )}
      {!showDropIndicator && props.data?.addButton && !readonly && (
        <PieceSelector
          operation={{
            type: FlowOperationType.ADD_ACTION,
            actionLocation: {
              parentStep: props.data.parentStep!,
              stepLocationRelativeToParent:
                props.data.stepLocationRelativeToParent!,
            },
          }}
          open={actionMenuOpen}
          onOpenChange={setActionMenuOpen}
        >
          <foreignObject
            width={18}
            height={18}
            x={buttonPosition.x - LINE_WIDTH / 2}
            y={buttonPosition.y}
            className={cn('rounded-xss cursor-pointer transition-all', {
              'shadow-add-button': actionMenuOpen,
            })}
          >
            <div
              className={cn(
                'bg-[#a6b1bf] cursor-pointer w-[18px] h-[18px] flex items-center justify-center  transition-all duration-300 ease-in-out',
                {
                  'bg-primary ': actionMenuOpen,
                },
              )}
            >
              {!actionMenuOpen && (
                <Plus className="w-3 h-3 stroke-[3px] text-white" />
              )}
            </div>
          </foreignObject>
        </PieceSelector>
      )}
    </>
  );
});

ApEdgeWithButton.displayName = 'ApEdgeWithButton';
export { ApEdgeWithButton };
