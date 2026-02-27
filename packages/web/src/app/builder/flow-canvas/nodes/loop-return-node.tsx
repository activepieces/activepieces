import { Handle, Position } from '@xyflow/react';

import { flowCanvasConsts } from '../utils/consts';

//used purely to help calculate the loop graph width
const ApLoopReturnCanvasNode = () => {
  return (
    <>
      <div
        className="h-px bg-transparent pointer-events-none "
        style={{
          width: flowCanvasConsts.AP_NODE_SIZE.LOOP_RETURN_NODE.width,
        }}
      ></div>
      <Handle
        type="source"
        position={Position.Top}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
    </>
  );
};

ApLoopReturnCanvasNode.displayName = 'EmptyLoopReturnCanvasNode';
export default ApLoopReturnCanvasNode;
