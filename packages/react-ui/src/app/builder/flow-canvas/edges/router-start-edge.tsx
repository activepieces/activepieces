import { BaseEdge, EdgeProps } from '@xyflow/react';

import { StepLocationRelativeToParent } from '@activepieces/shared';

import { flowCanvasConsts } from '../utils/consts';
import { ApRouterStartEdge } from '../utils/types';

import { ApAddButton } from './add-button';
import { BranchLabel } from './branch-label';

export const ApRouterStartCanvasEdge = ({
  sourceX,
  targetX,
  targetY,
  data,
  source,
  target,
  id,
}: EdgeProps & Omit<ApRouterStartEdge, 'position'>) => {
  const verticalLineLength =
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    flowCanvasConsts.LABEL_HEIGHT;

  const distanceBetweenSourceAndTarget = Math.abs(targetX - sourceX);
  const generatePath = () => {
    // Start point and initial vertical line
    let path = `M ${targetX} ${
      targetY - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
    }`;

    // Add arrow if branch is not empty
    if (!data.isBranchEmpty) {
      path += flowCanvasConsts.ARROW_DOWN;
    }

    // Vertical line up
    path += `v -${verticalLineLength}`;

    // Arc or vertical line based on distance
    if (distanceBetweenSourceAndTarget >= flowCanvasConsts.ARC_LENGTH) {
      // Add appropriate arc based on source position
      path +=
        sourceX > targetX ? ' a12,12 0 0,1 12,-12' : ' a-12,-12 0 0,0 -12,-12';

      if (data.drawHorizontalLine) {
        // Calculate horizontal line length
        const horizontalLength =
          (Math.abs(targetX - sourceX) + 3 - 2 * flowCanvasConsts.ARC_LENGTH) *
          (sourceX > targetX ? 1 : -1);

        // Add horizontal line and arc
        path += `h ${horizontalLength}`;
        path +=
          sourceX > targetX
            ? flowCanvasConsts.ARC_LEFT_UP
            : flowCanvasConsts.ARC_RIGHT_UP;
      }

      if (data.drawStartingVerticalLine) {
        // Add final vertical line
        const finalVerticalLength =
          flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS / 2 -
          2 * flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;
        path += `v -${finalVerticalLength}`;
      }
    } else {
      // If distance is small, just draw vertical line
      path += `v -${
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
      }`;
    }

    return path;
  };

  const path = generatePath();

  const branchLabelProps =
    data.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
      ? {
          label: data.label,
          sourceNodeName: source,
          targetNodeName: target,
          stepLocationRelativeToParent: data.stepLocationRelativeToParent,
          branchIndex: data.branchIndex,
        }
      : {
          label: data.label,
          sourceNodeName: source,
          targetNodeName: target,
          stepLocationRelativeToParent: data.stepLocationRelativeToParent,
        };

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowCanvasConsts.LINE_WIDTH}px` }}
      ></BaseEdge>
      {!data.isBranchEmpty && (
        <foreignObject
          x={targetX - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2}
          y={targetY - verticalLineLength / 2}
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          className="overflow-visible"
        >
          {data.stepLocationRelativeToParent !==
            StepLocationRelativeToParent.INSIDE_BRANCH && (
            <ApAddButton
              edgeId={id}
              stepLocationRelativeToParent={data.stepLocationRelativeToParent}
              parentStepName={source}
            ></ApAddButton>
          )}

          {data.stepLocationRelativeToParent ===
            StepLocationRelativeToParent.INSIDE_BRANCH && (
            <ApAddButton
              edgeId={id}
              stepLocationRelativeToParent={data.stepLocationRelativeToParent}
              parentStepName={source}
              branchIndex={data.branchIndex}
            ></ApAddButton>
          )}
        </foreignObject>
      )}

      <foreignObject
        width={flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10 + 'px'}
        height={
          flowCanvasConsts.LABEL_HEIGHT +
          flowCanvasConsts.LABEL_VERTICAL_PADDING +
          'px'
        }
        x={targetX - (flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10) / 2}
        y={
          targetY -
          verticalLineLength / 2 -
          flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height -
          30
        }
        className="flex items-center "
      >
        <BranchLabel
          key={branchLabelProps.label + branchLabelProps.targetNodeName}
          sourceNodeName={source}
          targetNodeName={target}
          stepLocationRelativeToParent={data.stepLocationRelativeToParent}
          branchIndex={data.branchIndex}
          label={data.label}
        />
      </foreignObject>
    </>
  );
};
