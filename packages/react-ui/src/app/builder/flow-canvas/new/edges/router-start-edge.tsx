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
  targetX,
  targetY,
  data,
  source,
  id,
}: EdgeProps & Omit<ApRouterStartEdge, 'position'>) => {
  const labelWidth = getElementWidth(data.label);
  const verticalLineLength =
    flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    flowUtilConsts.LABEL_HEIGHT;

  const distanceBetweenSourceAndTarget = Math.abs(targetX - sourceX);
  const path = `M ${targetX} ${
    targetY - flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
  }
      ${data.isBranchEmpty ? `` : flowUtilConsts.ARROW_DOWN}
      v -${verticalLineLength}    

      ${
        distanceBetweenSourceAndTarget >= flowUtilConsts.ARC_LENGTH
          ? sourceX > targetX
            ? ' a12,12 0 0,1 12,-12'
            : ' a-12,-12 0 0,0 -12,-12'
          : `
        v -${flowUtilConsts.ARC_LENGTH / 2}`
      } 

      ${
        distanceBetweenSourceAndTarget >= flowUtilConsts.ARC_LENGTH
          ? `
       ${
         data.drawHorizontalLine
           ? `h ${
               (Math.abs(targetX - sourceX) +
                 3 -
                 2 * flowUtilConsts.ARC_LENGTH) *
               (sourceX > targetX ? 1 : -1)
             }
                    ${
                      sourceX > targetX
                        ? flowUtilConsts.ARC_LEFT_UP
                        : flowUtilConsts.ARC_RIGHT_UP
                    }`
           : ``
       }
                  

                    ${
                      data.drawStartingVerticalLine
                        ? `v -${
                            flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS / 2 -
                            2 *
                              flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
                          }`
                        : ``
                    }


                  `
          : `
                `
      } 

     
  
  `;
  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowUtilConsts.LINE_WIDTH}px` }}
      ></BaseEdge>
      {!data.isBranchEmpty && (
        <foreignObject
          x={targetX - flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2}
          y={targetY - verticalLineLength / 2}
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
        width={Math.min(labelWidth, 300) + 'px'}
        height={flowUtilConsts.LABEL_HEIGHT + 2 + 'px'}
        x={targetX - Math.min(labelWidth, 300) / 2}
        y={
          targetY -
          verticalLineLength / 2 -
          flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height -
          15
        }
      >
        <div
          className="text-foreground bg-background select-none cursor-default py-[1px] max-w-[300px] truncate"
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
