import { Handle, Position } from '@xyflow/react';
import React from 'react';

const LoopStepPlaceHolder = React.memo(() => {
  return (
    <>
      <div className="h-[70px] w-[260px] "></div>

      <Handle type="source" style={{ opacity: 0 }} position={Position.Right} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </>
  );
});

LoopStepPlaceHolder.displayName = 'LoopStepPlaceHolder';
export { LoopStepPlaceHolder };
