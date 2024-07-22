import { Position, SmoothStepEdge } from '@xyflow/react';
import { Plus } from 'lucide-react';

import {
  RightSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';

interface ApEdgeWithButtonProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  data: Record<string, unknown>;
  arrowHeadType?: string;
  markerEndId?: string;
}

const ApEdgeWithButton: React.FC<ApEdgeWithButtonProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {
    stroke: '#c1c8d0',
  },
}) => {
  const setRightSidebar = useBuilderStateContext(
    (state) => state.setRightSidebar,
  );
  return (
    <>
      <SmoothStepEdge
        id={id}
        sourceX={sourceX}
        sourceY={sourceY}
        targetX={targetX}
        targetY={targetY}
        sourcePosition={sourcePosition}
        targetPosition={targetPosition}
        style={style}
      />
      {
        <foreignObject
          width={18}
          height={18}
          x={targetX - 9}
          y={targetY - 25}
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
      }
    </>
  );
};

export { ApEdgeWithButton };
