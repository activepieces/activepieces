import { BaseEdge, EdgeProps } from '@xyflow/react';

import { StepLocationRelativeToParent } from '@activepieces/shared';

import { flowCanvasConsts } from '../utils/consts';
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
  const verticalLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;

  const horizontalLineLength =
    (Math.abs(targetX - sourceX) - 2 * flowCanvasConsts.ARC_LENGTH) *
    (targetX > sourceX ? 1 : -1);

  const distanceBetweenTargetAndSource = Math.abs(targetX - sourceX);

  const generatePath = () => {
    // Start point
    let path = `M ${sourceX - 0.5} ${
      sourceY - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
    }`;

    // Vertical line from start
    path += `v ${data.verticalSpaceBetweenLastNodeInBranchAndEndLine}`;

    // Arc or vertical line based on distance
    if (distanceBetweenTargetAndSource >= flowCanvasConsts.ARC_LENGTH) {
      path +=
        targetX > sourceX
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
        targetX > sourceX
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

  const path = generatePath();

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowCanvasConsts.LINE_WIDTH}px` }}
      />

      {data.drawEndingVerticalLine && (
        <foreignObject
          x={
            targetX -
            flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2 -
            flowCanvasConsts.LINE_WIDTH / 2
          }
          y={targetY - verticalLineLength}
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
