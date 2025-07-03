import { Handle, Position } from '@xyflow/react';

import { flowUtilConsts } from '../utils/consts';

//used purely to help calculate the loop graph width
const ApLoopReturnCanvasNode = () => {
  return (
    <>
      <div
        className="h-[1px] bg-[transparent] pointer-events-none "
        style={{
          width: flowUtilConsts.AP_NODE_SIZE.LOOP_RETURN_NODE.width,
        }}
      ></div>
      <Handle
        type="source"
        position={Position.Top}
        style={flowUtilConsts.HANDLE_STYLING}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={flowUtilConsts.HANDLE_STYLING}
      />
    </>
  );
};

ApLoopReturnCanvasNode.displayName = 'EmptyLoopReturnCanvasNode';
export default ApLoopReturnCanvasNode;
