import { Position, SmoothStepEdge } from '@xyflow/react';

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
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="bg-[#a6b1bf]">
            <button className="edgebutton"></button>
          </div>
        </foreignObject>
      }
    </>
  );
};

export { ApEdgeWithButton };
