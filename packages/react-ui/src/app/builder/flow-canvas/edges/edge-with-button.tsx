import { BaseEdge } from '@xyflow/react';
import { Plus } from 'lucide-react';

import {
  RightSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';

import {
  AP_NODE_SIZE,
  ApNodeType,
  flowCanvasUtils,
} from '../flow-canvas-utils';

interface ApEdgeWithButtonProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data: {
    addButton: boolean;
    targetType: ApNodeType;
  };
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

const ApEdgeWithButton: React.FC<ApEdgeWithButtonProps> = (props) => {
  const setRightSidebar = useBuilderStateContext(
    (state) => state.setRightSidebar,
  );

  const { edgePath, buttonPosition } = getEdgePath(props);

  return (
    <>
      <BaseEdge
        interactionWidth={0}
        path={edgePath}
        style={{ strokeWidth: 1.5 }}
      />
      {props.data?.addButton && buttonPosition && (
        <foreignObject
          width={18}
          height={18}
          x={buttonPosition.x}
          y={buttonPosition.y}
          onClick={() => console.log('clicked')}
          className="edgebutton-foreignobject"
        >
          <div
            className="bg-[#a6b1bf] w-4 h-4 flex items-center justify-center"
            onClick={() => setRightSidebar(RightSideBarType.PIECE_SELECTOR)}
          >
            <Plus className="w-3 h-3 text-white" />
          </div>
        </foreignObject>
      )}
    </>
  );
};

export { ApEdgeWithButton };
