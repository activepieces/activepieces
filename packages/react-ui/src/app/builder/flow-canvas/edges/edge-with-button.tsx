import { flowHelper, isNil } from '@activepieces/shared';
import { useDndMonitor, useDroppable, DragMoveEvent } from '@dnd-kit/core';
import { BaseEdge, Position, SmoothStepEdge } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useBuilderStateContext } from '../../builder-hooks';
import {
  AP_NODE_SIZE,
  ApEdge,
  ApNodeType,
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
  const ARROW_RIGHT = 'm-6 -6 l6 6 m-6 6 l6 -6';

  const targetXWithPlaceHolder =
    targetX +
    (flowCanvasUtils.isPlaceHolder(data.targetType)
      ? AP_NODE_SIZE[data.targetType].width + 10
      : 0);

  const MID_X = (sourceX + targetX) / 2;
  const MID_Y = (sourceY + targetY) / 2;

  if (sourceY === targetY) {
    return {
      buttonPosition: {
        x: MID_X - BUTTON_SIZE.width / 2,
        y: sourceY - BUTTON_SIZE.height / 2,
      },
      edgePath: `M ${sourceX} ${sourceY} h ${
        targetXWithPlaceHolder - sourceX
      } ${data.targetType === ApNodeType.STEP_NODE ? ARROW_RIGHT : ''}`,
    };
  }

  const controlPointOffset = 1;

  return {
    buttonPosition: {
      x: MID_X - BUTTON_SIZE.width / 2,
      y: MID_Y - BUTTON_SIZE.height / 2,
    },
    edgePath: `M${sourceX} ${sourceY}
    C${MID_X - controlPointOffset} ${sourceY}, ${
      MID_X + controlPointOffset
    } ${targetY}, ${targetXWithPlaceHolder} ${targetY}
    ${data.targetType === ApNodeType.STEP_NODE ? ARROW_RIGHT : ''}`,
  };
}

const ApEdgeWithButton: React.FC<ApEdgeWithButtonProps> = (props) => {
  const isBranch =
    props.data.stepLocationRelativeToParent === 'INSIDE_FALSE_BRANCH' ||
    props.data.stepLocationRelativeToParent === 'INSIDE_TRUE_BRANCH';

  const [showButtonShadow, setShowButtonShadow] = useState(false);
  const [activeDraggingStep, flowVersion] = useBuilderStateContext((state) => [
    state.activeDraggingStep,
    state.flowVersion,
  ]);
  const { edgePath, buttonPosition } = getEdgePath(props);
  const { setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });
  const draggedStep = isNil(activeDraggingStep)
    ? undefined
    : flowHelper.getStep(flowVersion, activeDraggingStep);
  const parentStep = props.data?.parentStep;
  const isPartOfInnerFlow =
    isNil(parentStep) || isNil(draggedStep)
      ? false
      : flowHelper.isPartOfInnerFlow({
          parentStep: draggedStep,
          childName: parentStep,
        });
  const isDropzone = !isPartOfInnerFlow && !isNil(activeDraggingStep);

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      if (isPartOfInnerFlow) {
        return;
      }
      setShowButtonShadow(event.collisions?.[0]?.id === props.id);
    },
  });

  return (
    <>
      {isBranch ? (
        <SmoothStepEdge
          interactionWidth={0}
          style={{ strokeWidth: 1.5 }}
          label=""
          sourceX={props.sourceX}
          sourceY={props.sourceY}
          targetX={props.targetX}
          targetY={props.targetY}
          sourcePosition={Position.Right}
          targetPosition={Position.Left}
        />
      ) : (
        <BaseEdge
          interactionWidth={0}
          path={edgePath}
          style={{ strokeWidth: 1.5 }}
        />
      )}

      {isDropzone && props.data?.addButton && buttonPosition && (
        <foreignObject
          width={18}
          height={18}
          x={buttonPosition.x}
          y={buttonPosition.y}
          className={cn(
            'bg-primary w-[17px] h-[17px] rounded-[3px] box-content opacity-90',
            {
              // TODO fix colors and add box shadow
              'bg-destructive': showButtonShadow,
            },
          )}
        >
          <div className="w-4 h-4" ref={setNodeRef}></div>
        </foreignObject>
      )}
      {!isDropzone && props.data?.addButton && buttonPosition && (
        <foreignObject
          width={18}
          height={18}
          x={buttonPosition.x}
          y={buttonPosition.y}
          onClick={() => console.log('clicked')}
        >
          <div
            className="bg-[#a6b1bf] w-4 h-4 flex items-center justify-center"
            onClick={() => {
              console.log('clicked');
            }}
          >
            <Plus className="w-3 h-3 text-white" />
          </div>
        </foreignObject>
      )}
    </>
  );
};

export { ApEdgeWithButton };
