import { StepLocationRelativeToParent } from '@activepieces/shared';
import {
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  Position,
} from '@xyflow/react';

import { flowCanvasConsts } from '../utils/consts';
import { ApStraightLineEdge } from '../utils/types';

import { ApAddButton } from './add-button';
import { useEdgeLayoutSpace } from './use-edge-layout-space';

export const ApStraightLineCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  id,
}: EdgeProps & ApStraightLineEdge) => {
  const {
    isHorizontal,
    layoutSource,
    layoutTarget,
    toCanvasPath,
    adaptiveArrowHead,
  } = useEdgeLayoutSpace({ sourceX, sourceY, targetX, targetY });
  const isAlignedWithAutoLayout =
    Math.abs(layoutTarget.x - layoutSource.x) < 1 &&
    layoutTarget.y > layoutSource.y;

  const buildAlignedEdge = () => {
    const lineLength = layoutTarget.y - layoutSource.y;
    const layoutPath = `M ${layoutSource.x} ${layoutSource.y} v${lineLength}
   ${data.drawArrowHead ? flowCanvasConsts.ARROW_DOWN : ''}`;
    return {
      path: toCanvasPath(layoutPath),
      buttonCenter: {
        x: (sourceX + targetX) / 2,
        y: (sourceY + targetY) / 2,
      },
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
    return {
      path: `${smoothPath} ${data.drawArrowHead ? adaptiveArrowHead : ''}`,
      buttonCenter: { x: labelX, y: labelY },
    };
  };

  const { path, buttonCenter } = isAlignedWithAutoLayout
    ? buildAlignedEdge()
    : buildAdaptiveEdge();

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowCanvasConsts.LINE_WIDTH}px` }}
      />
      {!data.hideAddButton && (
        <foreignObject
          x={
            buttonCenter.x - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2
          }
          y={
            buttonCenter.y - flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height / 2
          }
          width={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height}
          className="overflow-visible cursor-default"
        >
          <ApAddButton
            edgeId={id}
            parentStepName={data.parentStepName}
            stepLocationRelativeToParent={StepLocationRelativeToParent.AFTER}
          ></ApAddButton>
        </foreignObject>
      )}
    </>
  );
};
