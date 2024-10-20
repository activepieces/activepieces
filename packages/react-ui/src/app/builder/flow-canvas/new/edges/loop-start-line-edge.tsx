import { BaseEdge, EdgeProps } from '@xyflow/react';
import { ApLoopStartEdge } from '../types';
import { flowUtilConsts } from '../consts';
import { ApAddButton } from './add-button';
import { StepLocationRelativeToParent } from '../../../../../../../shared/src';

export const ApLoopStartLineCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  data,
  source,
  id,
}: EdgeProps & ApLoopStartEdge) => {
  const startX = sourceX;
  const startY = sourceY + flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
  const verticalLineLength =
    flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;

  const horizontalLineLength = targetX - startX - 2 * flowUtilConsts.ARC_LENGTH;
  const path = `M ${startX} ${startY} v${verticalLineLength / 2}
  ${flowUtilConsts.ARC_RIGHT_DOWN} h${horizontalLineLength}
  ${flowUtilConsts.ARC_RIGHT} v${verticalLineLength}
   ${!data.isLoopEmpty ? flowUtilConsts.ARROW_DOWN : ''}`;

  const showDebugForLineEndPoint = false;
  const buttonPosition = {
    x:
      startX -
      flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 +
      horizontalLineLength +
      flowUtilConsts.ARC_LENGTH * 2,
    y: startY + verticalLineLength + flowUtilConsts.ARC_LENGTH,
  };
  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowUtilConsts.LINE_WIDTH}px` }}
        className="relative"
      ></BaseEdge>
      {!data.isLoopEmpty && (
        <foreignObject
          x={buttonPosition.x}
          y={buttonPosition.y}
          width={flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height}
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
          x={startX}
          y={startY}
          className="w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center absolute"
        >
          <div className=" w-[20px] h-[20px] rounded-full bg-[red] flex items-center justify-center"></div>
        </foreignObject>
      )}
    </>
  );
};
