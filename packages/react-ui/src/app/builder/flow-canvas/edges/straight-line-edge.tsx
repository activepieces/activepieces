import { BaseEdge, EdgeProps } from '@xyflow/react';

import { StepLocationRelativeToParent } from '@activepieces/shared';

import { flowCanvasConsts } from '../utils/consts';
import { ApStraightLineEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApStraightLineCanvasEdge = ({
  sourceX,
  sourceY,
  targetY,
  data,
  id,
  source,
}: EdgeProps & ApStraightLineEdge) => {
  const lineStartX = sourceX;
  const lineStartY = sourceY;
  const lineLength = targetY - sourceY;
  const path = `M ${lineStartX} ${lineStartY} v${lineLength}
   ${data.drawArrowHead ? flowCanvasConsts.ARROW_DOWN : ''}`;
  const showDebugForLineEndPoint = false;

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowCanvasConsts.LINE_WIDTH}px` }}
      />
      {!data.hideAddButton && (
        <foreignObject
          x={lineStartX - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2}
          y={
            lineStartY +
            (targetY - sourceY) / 2 -
            flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height / 2
          }
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          className="overflow-visible cursor-default"
        >
          <ApAddButton
            edgeId={id}
            parentStepName={source}
            stepLocationRelativeToParent={StepLocationRelativeToParent.AFTER}
          ></ApAddButton>
        </foreignObject>
      )}

      {showDebugForLineEndPoint && (
        <foreignObject
          x={lineStartX}
          y={lineStartY + targetY - sourceY}
          className="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div className=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center"></div>
        </foreignObject>
      )}
    </>
  );
};
