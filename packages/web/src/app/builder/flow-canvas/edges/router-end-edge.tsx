import { StepLocationRelativeToParent } from '@activepieces/shared';
import { BaseEdge, EdgeProps } from '@xyflow/react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { svgPathUtils } from '../utils/svg-path-utils';
import { ApRouterEndEdge } from '../utils/types';

import { ApAddButton } from './add-button';

export const ApRouterEndCanvasEdge = ({
  sourceX,
  targetX,
  targetY,
  sourceY,
  data,
  id,
}: EdgeProps & Omit<ApRouterEndEdge, 'position'>) => {
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
    (Math.abs(layoutTarget.x - layoutSource.x) -
      2 * flowCanvasConsts.ARC_LENGTH) *
    (layoutTarget.x > layoutSource.x ? 1 : -1);

  const distanceBetweenTargetAndSource = Math.abs(
    layoutTarget.x - layoutSource.x,
  );

  const generateLayoutPath = () => {
    // Start point
    let path = `M ${layoutSource.x - 0.5} ${
      layoutSource.y - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
    }`;

    // Vertical line from start
    path += `v ${data.verticalSpaceBetweenLastNodeInBranchAndEndLine}`;

    // Arc or vertical line based on distance
    if (distanceBetweenTargetAndSource >= flowCanvasConsts.ARC_LENGTH) {
      path +=
        layoutTarget.x > layoutSource.x
          ? flowCanvasConsts.ARC_RIGHT_DOWN
          : flowCanvasConsts.ARC_LEFT_DOWN;
    } else {
      path += `v ${
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
        2
      }`;
    }

    // Optional horizontal line
    if (data.drawHorizontalLine) {
      path += `h ${horizontalLineLength} ${
        layoutTarget.x > layoutSource.x
          ? flowCanvasConsts.ARC_RIGHT
          : flowCanvasConsts.ARC_LEFT
      }`;
    }

    // Optional ending vertical line with arrow
    if (data.drawEndingVerticalLine) {
      path += `v${verticalLineLength}`;
      if (!data.isNextStepEmpty) {
        path += flowCanvasConsts.ARROW_DOWN;
      }
    }

    return path;
  };

  const layoutPath = generateLayoutPath();
  const path = isHorizontal
    ? svgPathUtils.transposePath(layoutPath)
    : layoutPath;

  const buttonPosition = isHorizontal
    ? {
        x: targetX - verticalLineLength,
        y:
          targetY -
          flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height / 2 -
          flowCanvasConsts.LINE_WIDTH / 2,
      }
    : {
        x:
          targetX -
          flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 -
          flowCanvasConsts.LINE_WIDTH / 2,
        y: targetY - verticalLineLength,
      };

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowCanvasConsts.LINE_WIDTH}px` }}
      />

      {data.drawEndingVerticalLine && (
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
            parentStepName={data.routerOrBranchStepName}
          />
        </foreignObject>
      )}
    </>
  );
};
