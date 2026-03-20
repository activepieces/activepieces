import { Handle, Position } from '@xyflow/react';

import { flowCanvasConsts } from '../utils/consts';
import { ApGraphEndNode } from '../utils/types';
import FlowEndWidget from '../widgets/flow-end-widget';

const ApGraphEndWidgetNode = ({ data }: Omit<ApGraphEndNode, 'position'>) => {
  return (
    <>
      <div className="h-px w-px relative ">
        {data.showWidget && <FlowEndWidget></FlowEndWidget>}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
    </>
  );
};

ApGraphEndWidgetNode.displayName = 'ApGraphEndWidgetNode';
export default ApGraphEndWidgetNode;
