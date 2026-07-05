import { Handle, Position } from '@xyflow/react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';

//used purely to help calculate the loop graph width
const ApLoopReturnCanvasNode = () => {
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const isHorizontal = canvasOrientation === 'horizontal';
  return (
    <>
      <div
        className="bg-transparent pointer-events-none"
        style={
          isHorizontal
            ? {
                width: '1px',
                height: flowCanvasConsts.STEP_NODE_SIZE.horizontal.height,
              }
            : {
                height: '1px',
                width: flowCanvasConsts.AP_NODE_SIZE.LOOP_RETURN_NODE.width,
              }
        }
      ></div>
      <Handle
        type="source"
        position={isHorizontal ? Position.Left : Position.Top}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
      <Handle
        type="target"
        position={isHorizontal ? Position.Right : Position.Bottom}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
    </>
  );
};

ApLoopReturnCanvasNode.displayName = 'EmptyLoopReturnCanvasNode';
export default ApLoopReturnCanvasNode;
