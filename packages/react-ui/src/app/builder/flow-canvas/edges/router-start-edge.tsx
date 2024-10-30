import { BaseEdge, EdgeProps } from '@xyflow/react';
import { ApRouterStartEdge } from '../types';
import { flowUtilConsts } from '../consts';
import { ApAddButton } from './add-button';
import { StepLocationRelativeToParent } from '../../../../../../shared/src';
import { BranchLabel, BranchLabelProps } from './branch-label';



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
    flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS -
    flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
    flowUtilConsts.LABEL_HEIGHT;

  const distanceBetweenSourceAndTarget = Math.abs(targetX - sourceX);
  const path = `M ${targetX} ${targetY - flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE
    }
      ${data.isBranchEmpty ? `` : flowUtilConsts.ARROW_DOWN}
      v -${verticalLineLength}    

      ${distanceBetweenSourceAndTarget >= flowUtilConsts.ARC_LENGTH
      ? sourceX > targetX
        ? ' a12,12 0 0,1 12,-12'
        : ' a-12,-12 0 0,0 -12,-12'
      : `
        v -${flowUtilConsts.ARC_LENGTH + flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE}`
    } 

      ${distanceBetweenSourceAndTarget >= flowUtilConsts.ARC_LENGTH
      ? `
       ${data.drawHorizontalLine
        ? `h ${(Math.abs(targetX - sourceX) +
          3 -
          2 * flowUtilConsts.ARC_LENGTH) *
        (sourceX > targetX ? 1 : -1)
        }
                    ${sourceX > targetX
          ? flowUtilConsts.ARC_LEFT_UP
          : flowUtilConsts.ARC_RIGHT_UP
        }`
        : ``
      }
                  

                    ${data.drawStartingVerticalLine
        ? `v -${flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS / 2 -
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


  const brancLabelProps: BranchLabelProps = data.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH ? {
    label: data.label,
    sourceNodeName: source,
    targetNodeName: target,
    stepLocationRelativeToParent: data.stepLocationRelativeToParent,
    branchIndex: data.branchIndex,
  } : {
    label: data.label,
    sourceNodeName: source,
    targetNodeName: target,
    stepLocationRelativeToParent: data.stepLocationRelativeToParent,
  };

  return (
    <>
      <BaseEdge
        path={path}
        style={{ strokeWidth: `${flowUtilConsts.LINE_WIDTH}px` }}
      ></BaseEdge>
      {!data.isBranchEmpty && (
        <foreignObject
          x={targetX - flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.width / 2}
          y={targetY - verticalLineLength / 2 + 10}
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
        width={flowUtilConsts.AP_NODE_SIZE.STEP.width - 10 + 'px'}
        height={
          flowUtilConsts.LABEL_HEIGHT +
          flowUtilConsts.LABEL_VERTICAL_PADDING +
          'px'
        }
        x={targetX - (flowUtilConsts.AP_NODE_SIZE.STEP.width - 10) / 2}
        y={
          targetY -
          verticalLineLength / 2 -
          flowUtilConsts.AP_NODE_SIZE.ADD_BUTTON.height -
          40
        }
        className="flex items-center "
      >
        <BranchLabel
          key={brancLabelProps.label + brancLabelProps.targetNodeName}
          {...brancLabelProps}
        />
      </foreignObject>
    </>
  );
};
