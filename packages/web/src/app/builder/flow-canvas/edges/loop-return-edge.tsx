import { StepLocationRelativeToParent } from '@activepieces/shared';
import { BaseEdge, EdgeProps } from '@xyflow/react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { svgPathUtils } from '../utils/svg-path-utils';
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
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const isHorizontal = canvasOrientation === 'horizontal';
  const layout = flowCanvasConsts.ORIENTATION_LAYOUT[canvasOrientation];
  const layoutSource = isHorizontal
    ? { x: sourceY, y: sourceX }
    : { x: sourceX, y: sourceY };
  const layoutTarget = isHorizontal
    ? { x: targetY, y: targetX }
    : { x: targetX, y: targetY };

  const horizontalLineLength =
    Math.abs(layoutSource.x - layoutTarget.x) - 2 * flowCanvasConsts.ARC_LENGTH;

  const verticalLineLength = data.verticalSpaceBetweenReturnNodeStartAndEnd;
  const ARROW_RIGHT = ` m-5 -6 l6 6  m-6 0 m6 0 l-6 6 m3 -6`;
  const endLineLength =
    layout.spaceAlongBetweenSteps -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    8;
  const layoutPath = `
  M ${layoutSource.x - 0.5} ${
    layoutSource.y - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
  }
  v 1
  ${flowCanvasConsts.ARC_LEFT_DOWN} h -${horizontalLineLength}
  ${flowCanvasConsts.ARC_RIGHT_UP} v -${verticalLineLength}
  a15,15 0 0,1 15,-15

  h ${horizontalLineLength / 2 - 2 * flowCanvasConsts.ARC_LENGTH}
   ${ARROW_RIGHT}

  M ${
    layoutSource.x - flowCanvasConsts.ARC_LENGTH - horizontalLineLength / 2
  } ${
    layoutSource.y +
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    flowCanvasConsts.ARC_LENGTH / 2
  }
   v${endLineLength} ${
    data.drawArrowHeadAfterEnd ? flowCanvasConsts.ARROW_DOWN : ''
  }
   `;
  const path = isHorizontal
    ? svgPathUtils.transposePath(layoutPath)
    : layoutPath;
  const layoutButtonPosition = {
    x:
      layoutSource.x -
      horizontalLineLength / 2 -
      flowCanvasConsts.ARC_LENGTH -
      flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2,
    y: layoutSource.y + endLineLength / 2,
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
    </>
  );
};
