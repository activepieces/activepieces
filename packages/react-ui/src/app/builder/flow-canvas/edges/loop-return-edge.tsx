import { BaseEdge, EdgeProps } from '@xyflow/react';

import { StepLocationRelativeToParent } from '@activepieces/shared';

import { flowCanvasConsts } from '../utils/consts';
import { ApLoopReturnEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApLoopReturnLineCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  id,
}: EdgeProps & ApLoopReturnEdge) => {
  const horizontalLineLength =
    Math.abs(sourceX - targetX) - 2 * flowCanvasConsts.ARC_LENGTH;

  const verticalLineLength = data.verticalSpaceBetweenReturnNodeStartAndEnd;
  const ARROW_RIGHT = ` m-5 -6 l6 6  m-6 0 m6 0 l-6 6 m3 -6`;
  const endLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    8;
  const path = `
  M ${sourceX - 0.5} ${
    sourceY - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
  }
  v 1
  ${flowCanvasConsts.ARC_LEFT_DOWN} h -${horizontalLineLength}
  ${flowCanvasConsts.ARC_RIGHT_UP} v -${verticalLineLength}
  a15,15 0 0,1 15,-15
  
  h ${horizontalLineLength / 2 - 2 * flowCanvasConsts.ARC_LENGTH}
   ${ARROW_RIGHT}
 
  M ${sourceX - flowCanvasConsts.ARC_LENGTH - horizontalLineLength / 2} ${
    sourceY +
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    flowCanvasConsts.ARC_LENGTH / 2
  }
   v${endLineLength} ${
    data.drawArrowHeadAfterEnd ? flowCanvasConsts.ARROW_DOWN : ''
  } 
   `;
  const buttonPosition = {
    x:
      sourceX -
      horizontalLineLength / 2 -
      flowCanvasConsts.ARC_LENGTH -
      flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2,
    y: sourceY + endLineLength / 2,
  };
  const showDebugForLineEndPoint = false;
  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowCanvasConsts.LINE_WIDTH}px` }}
        className="relative"
      ></BaseEdge>
      {showDebugForLineEndPoint && (
        <foreignObject
          x={targetX}
          y={targetY}
          className="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div className=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center"></div>
        </foreignObject>
      )}

      {
        <foreignObject
          x={buttonPosition.x}
          y={buttonPosition.y}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          className="overflow-visible"
        >
          <ApAddButton
            edgeId={id}
            stepLocationRelativeToParent={StepLocationRelativeToParent.AFTER}
            parentStepName={data.parentStepName}
          ></ApAddButton>
        </foreignObject>
      }

      {showDebugForLineEndPoint && (
        <foreignObject
          x={sourceX}
          y={sourceY}
          className="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div className=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center"></div>
        </foreignObject>
      )}
    </>
  );
};
