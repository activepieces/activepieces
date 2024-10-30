import { Handle, NodeProps, Position } from '@xyflow/react';
import { flowUtilConsts } from '../consts';

//used purely to help calculate the loop graph width
const ApLoopReturnCanvasNode = (props: NodeProps) => {
  return (
    <>
      <div className="w-[1px] h-[1px] "></div>
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
