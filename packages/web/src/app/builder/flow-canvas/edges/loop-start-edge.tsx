import { StepLocationRelativeToParent } from '@activepieces/shared';
import { BaseEdge, EdgeProps } from '@xyflow/react';

import { flowCanvasConsts } from '../utils/consts';
import { ApLoopStartEdge } from '../utils/types';

import { ApAddButton } from './add-button';
import { useEdgeLayoutSpace } from './use-edge-layout-space';

export const ApLoopStartLineCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  source,
  id,
}: EdgeProps & ApLoopStartEdge) => {
  const { isHorizontal, layout, layoutSource, layoutTarget, toCanvasPath } =
    useEdgeLayoutSpace({ sourceX, sourceY, targetX, targetY });

  const verticalLineLength =
    layout.spaceAlongBetweenSteps -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
  const horizontalLineLength =
    Math.abs(layoutTarget.x - layoutSource.x) - 2 * flowCanvasConsts.ARC_LENGTH;

  const layoutStartY =
    layoutSource.y + flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
  const layoutPath = `M ${layoutSource.x} ${layoutStartY} v${
    verticalLineLength / 2
  }
  ${flowCanvasConsts.ARC_RIGHT_DOWN} h${horizontalLineLength}
  ${flowCanvasConsts.ARC_RIGHT} v${verticalLineLength}
   ${!data.isLoopEmpty ? flowCanvasConsts.ARROW_DOWN : ''}`;
  const path = toCanvasPath(layoutPath);
  const layoutButtonPosition = {
    x:
      layoutSource.x -
      flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 +
      horizontalLineLength +
      flowCanvasConsts.ARC_LENGTH * 2,
    y: layoutStartY + verticalLineLength + flowCanvasConsts.ARC_LENGTH,
  };
  const buttonPosition = isHorizontal
    ? { x: layoutButtonPosition.y, y: layoutButtonPosition.x }
    : layoutButtonPosition;

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
    </>
  );
};
