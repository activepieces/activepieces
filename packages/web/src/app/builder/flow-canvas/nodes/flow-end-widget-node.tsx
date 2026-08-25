import { Handle, Position } from '@xyflow/react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { ApGraphEndNode } from '../utils/types';
import FlowEndWidget from '../widgets/flow-end-widget';

const ApGraphEndWidgetNode = ({ data }: Omit<ApGraphEndNode, 'position'>) => {
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const isHorizontal = canvasOrientation === 'horizontal';
  return (
    <>
      <div className="h-px w-px relative ">
        {data.showWidget && (
          <div
            style={
              isHorizontal
                ? { position: 'absolute', left: '28px', top: '-14px' }
                : undefined
            }
          >
            <FlowEndWidget></FlowEndWidget>
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        style={flowCanvasConsts.HANDLE_STYLING}
      />
    </>
  );
};

ApGraphEndWidgetNode.displayName = 'ApGraphEndWidgetNode';
export default ApGraphEndWidgetNode;
