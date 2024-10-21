import { BaseEdge, EdgeProps } from '@xyflow/react';
import { ApRouterStartEdge } from '../types';
import { flowUtilConsts } from '../consts';
import { ApAddButton } from './add-button';
import { StepLocationRelativeToParent } from '../../../../../../../shared/src';

const getElementWidth = (text: string) => {
  // Create a temporary element to calculate the pixel value
  const tempElement = document.createElement('span');
  tempElement.style.fontSize = flowUtilConsts.LABEL_HEIGHT + 'px'; // Set the font size
  tempElement.innerHTML = text; // Set the text content
  document.body.appendChild(tempElement); // Append to the body to apply styles
  const width = tempElement.getBoundingClientRect().width; // Get computed font size in pixels
  document.body.removeChild(tempElement); // Clean up

  return width; // Return the pixel value
};

export const ApRouterStartCanvasEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  source,
  id,
}: EdgeProps & Omit<ApRouterStartEdge, 'position'>) => {
  const verticalLineLength =
    flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    2 * flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE;

  const startY = data.drawStartingVerticalLine
    ? sourceY + flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE / 2
    : sourceY + verticalLineLength / 2 + flowUtilConsts.ARC_LENGTH - 10;

  const path = `
    M ${sourceX} ${startY}
    ${data.drawStartingVerticalLine ? `v${verticalLineLength / 2}` : ''}

    ${
      targetX > sourceX
        ? flowUtilConsts.ARC_RIGHT_DOWN
        : flowUtilConsts.ARC_LEFT_DOWN
    }
    h ${
      (Math.abs(targetX - sourceX) - flowUtilConsts.ARC_LENGTH * 2) *
      (targetX > sourceX ? 1 : -1)
    }

    ${targetX > sourceX ? flowUtilConsts.ARC_RIGHT : flowUtilConsts.ARC_LEFT}

    v ${verticalLineLength + flowUtilConsts.LABEL_HEIGHT}

    ${!data.isBranchEmpty ? flowUtilConsts.ARROW_DOWN : ''}
  `;

  const labelWidth = getElementWidth(data.label);

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowUtilConsts.LINE_WIDTH}px` }}
      ></BaseEdge>
      {!data.isBranchEmpty && (
        <foreignObject
          x={targetX - flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2}
          y={
            targetY -
            verticalLineLength +
            flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height
          }
          width={flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width}
          height={flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height}
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
        </foreignObject>
      )}
      <foreignObject
        width={labelWidth + 'px'}
        height={flowUtilConsts.LABEL_HEIGHT + 2 + 'px'}
        x={targetX - labelWidth / 2}
        y={
          targetY -
          flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE -
          flowUtilConsts.LABEL_HEIGHT / 2 -
          verticalLineLength
        }
      >
        <div
          className="text-foreground bg-background select-none cursor-default py-[1px]"
          style={{
            fontSize: flowUtilConsts.LABEL_HEIGHT + 'px',
            lineHeight: flowUtilConsts.LABEL_HEIGHT + 'px',
          }}
        >
          {data.label}
        </div>
      </foreignObject>
    </>
  );
};
