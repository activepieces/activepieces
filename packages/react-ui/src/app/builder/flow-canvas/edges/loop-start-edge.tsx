import { BaseEdge, EdgeProps } from '@xyflow/react';

import { StepLocationRelativeToParent } from '@activepieces/shared';

import { flowCanvasConsts } from '../utils/consts';
import { ApLoopStartEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApLoopStartLineCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  data,
  source,
  id,
}: EdgeProps & ApLoopStartEdge) => {
  const startY =
    sourceY + flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
  const verticalLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;

  const horizontalLineLength =
    Math.abs(targetX - sourceX) - 2 * flowCanvasConsts.ARC_LENGTH;
  const path = `M ${sourceX} ${startY} v${verticalLineLength / 2}
  ${flowCanvasConsts.ARC_RIGHT_DOWN} h${horizontalLineLength}
  ${flowCanvasConsts.ARC_RIGHT} v${verticalLineLength}
   ${!data.isLoopEmpty ? flowCanvasConsts.ARROW_DOWN : ''}`;

  const showDebugForLineEndPoint = false;
  const buttonPosition = {
    x:
      sourceX -
      flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 +
      horizontalLineLength +
      flowCanvasConsts.ARC_LENGTH * 2,
    y: startY + verticalLineLength + flowCanvasConsts.ARC_LENGTH,
  };

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowCanvasConsts.LINE_WIDTH}px` }}
        className="relative"
      ></BaseEdge>
      {!data.isLoopEmpty && (
        <foreignObject
          x={buttonPosition.x}
          y={buttonPosition.y}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          className="overflow-visible cursor-default"
        >
          <ApAddButton
            edgeId={id}
            stepLocationRelativeToParent={
              StepLocationRelativeToParent.INSIDE_LOOP
            }
            parentStepName={source}
          ></ApAddButton>
        </foreignObject>
      )}

      {showDebugForLineEndPoint && (
        <foreignObject
          x={sourceX}
          y={startY}
          className="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div className=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center"></div>
        </foreignObject>
      )}
    </>
  );
};
