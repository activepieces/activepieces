import { StepLocationRelativeToParent } from '@activepieces/shared';
import {
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  Position,
} from '@xyflow/react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { svgPathUtils } from '../utils/svg-path-utils';
import { ApLoopStartEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApLoopStartLineCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  source,
  id,
}: EdgeProps & ApLoopStartEdge) => {
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

  const verticalLineLength =
    layout.spaceAlongBetweenSteps -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
  const horizontalLineLength =
    Math.abs(layoutTarget.x - layoutSource.x) - 2 * flowCanvasConsts.ARC_LENGTH;

  // handles render a couple of pixels outside the node bounds, so compare with a tolerance
  const isAlignedWithAutoLayout =
    Math.abs(layoutTarget.y - layoutSource.y - layout.loopOffsetAlong) < 10 &&
    layoutTarget.x - layoutSource.x >= 2 * flowCanvasConsts.ARC_LENGTH;

  const buildAlignedEdge = () => {
    const layoutStartY =
      layoutSource.y + flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
    const layoutPath = `M ${layoutSource.x} ${layoutStartY} v${
      verticalLineLength / 2
    }
  ${flowCanvasConsts.ARC_RIGHT_DOWN} h${horizontalLineLength}
  ${flowCanvasConsts.ARC_RIGHT} v${verticalLineLength}
   ${!data.isLoopEmpty ? flowCanvasConsts.ARROW_DOWN : ''}`;
    const layoutButtonPosition = {
      x:
        layoutSource.x -
        flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 +
        horizontalLineLength +
        flowCanvasConsts.ARC_LENGTH * 2,
      y: layoutStartY + verticalLineLength + flowCanvasConsts.ARC_LENGTH,
    };
    return {
      path: isHorizontal ? svgPathUtils.transposePath(layoutPath) : layoutPath,
      buttonPosition: isHorizontal
        ? { x: layoutButtonPosition.y, y: layoutButtonPosition.x }
        : layoutButtonPosition,
    };
  };

  const buildAdaptiveEdge = () => {
    const [smoothPath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      borderRadius: flowCanvasConsts.ARC_LENGTH,
    });
    const arrowHead = isHorizontal
      ? flowCanvasConsts.ARROW_RIGHT_HEAD
      : flowCanvasConsts.ARROW_DOWN;
    return {
      path: `${smoothPath} ${!data.isLoopEmpty ? arrowHead : ''}`,
      buttonPosition: {
        x: labelX - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2,
        y: labelY - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height / 2,
      },
    };
  };

  const { path, buttonPosition } = isAlignedWithAutoLayout
    ? buildAlignedEdge()
    : buildAdaptiveEdge();

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
