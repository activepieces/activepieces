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
import { ApRouterStartEdge } from '../utils/types';

import { ApAddButton } from './add-button';
import { BranchLabel } from './branch-label';

// distance between the branch node and the right edge of the entry-line add button
const HORIZONTAL_BUTTON_END_MARGIN = 26;
// gap between the branch label pill and the entry-line add button
const HORIZONTAL_LABEL_BUTTON_GAP = 14;

export const ApRouterStartCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  source,
  target,
  id,
}: EdgeProps & Omit<ApRouterStartEdge, 'position'>) => {
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
    flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    (layout.routerOffsetAlong - layout.loopOffsetAlong);

  // handles render a couple of pixels outside the node bounds, so compare with a tolerance
  const isAlignedWithAutoLayout =
    Math.abs(layoutTarget.y - layoutSource.y - layout.routerOffsetAlong) < 10;

  const distanceBetweenSourceAndTarget = Math.abs(
    layoutTarget.x - layoutSource.x,
  );
  const generateAlignedLayoutPath = () => {
    // Start point and initial vertical line
    let path = `M ${layoutTarget.x} ${
      layoutTarget.y - flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
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
        layoutSource.x > layoutTarget.x
          ? ' a12,12 0 0,1 12,-12'
          : ' a-12,-12 0 0,0 -12,-12';

      if (data.drawHorizontalLine) {
        // Calculate horizontal line length
        const horizontalLength =
          (Math.abs(layoutTarget.x - layoutSource.x) +
            3 -
            2 * flowCanvasConsts.ARC_LENGTH) *
          (layoutSource.x > layoutTarget.x ? 1 : -1);

        // Add horizontal line and arc
        path += `h ${horizontalLength}`;
        path +=
          layoutSource.x > layoutTarget.x
            ? flowCanvasConsts.ARC_LEFT_UP
            : flowCanvasConsts.ARC_RIGHT_UP;
      }

      if (data.drawStartingVerticalLine) {
        // Add final vertical line
        const finalVerticalLength =
          layout.spaceAlongBetweenSteps / 2 -
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

  const buildAlignedEdge = () => {
    const layoutPath = generateAlignedLayoutPath();
    return {
      path: isHorizontal ? svgPathUtils.transposePath(layoutPath) : layoutPath,
      buttonPosition: isHorizontal
        ? {
            // sits on the entry line, right before the arrow head
            x:
              targetX -
              HORIZONTAL_BUTTON_END_MARGIN -
              flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width,
            y: targetY - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height / 2,
          }
        : {
            x: targetX - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2,
            y: targetY - verticalLineLength / 2,
          },
      labelAnchor: null,
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
      path: `${smoothPath} ${!data.isBranchEmpty ? arrowHead : ''}`,
      buttonPosition: {
        x: labelX - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2,
        y: labelY - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height / 2,
      },
      labelAnchor: { x: labelX, y: labelY },
    };
  };

  const { path, buttonPosition, labelAnchor } = isAlignedWithAutoLayout
    ? buildAlignedEdge()
    : buildAdaptiveEdge();

  const labelBoxWidth = flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10;
  const labelBoxHeight =
    flowCanvasConsts.LABEL_HEIGHT + flowCanvasConsts.LABEL_VERTICAL_PADDING;
  const getLabelBoxPosition = () => {
    if (labelAnchor) {
      return {
        x: labelAnchor.x - labelBoxWidth / 2,
        y: labelAnchor.y - labelBoxHeight - 4,
      };
    }
    if (isHorizontal) {
      // the pill sits on the entry line itself (its background masks the line),
      // ending right before the add button / branch slot
      const labelEndX = data.isBranchEmpty
        ? targetX - HORIZONTAL_BUTTON_END_MARGIN + 4
        : targetX -
          HORIZONTAL_BUTTON_END_MARGIN -
          flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width -
          HORIZONTAL_LABEL_BUTTON_GAP;
      return {
        x: labelEndX - labelBoxWidth,
        y: targetY - labelBoxHeight / 2,
      };
    }
    return {
      x: targetX - labelBoxWidth / 2,
      y:
        targetY -
        verticalLineLength / 2 -
        flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height -
        30,
    };
  };
  const labelBoxPosition = getLabelBoxPosition();
  const labelAlign =
    isHorizontal && isAlignedWithAutoLayout
      ? ('end' as const)
      : ('center' as const);

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
          x={buttonPosition.x}
          y={buttonPosition.y}
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
        width={labelBoxWidth + 'px'}
        height={labelBoxHeight + 'px'}
        x={labelBoxPosition.x}
        y={labelBoxPosition.y}
        className="flex items-center pointer-events-none"
      >
        <BranchLabel
          key={branchLabelProps.label + branchLabelProps.targetNodeName}
          align={labelAlign}
          {...branchLabelProps}
        />
      </foreignObject>
    </>
  );
};
