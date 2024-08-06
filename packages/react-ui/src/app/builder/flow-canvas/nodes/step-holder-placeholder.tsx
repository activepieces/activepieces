import { Handle, Position } from '@xyflow/react';
import React from 'react';

const StepPlaceHolder = React.memo(() => {
  return (
    <>
      <div className="h-[1px] w-[260px] "></div>
      <Handle type="source" style={{ opacity: 0 }} position={Position.Bottom} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </>
  );
});

StepPlaceHolder.displayName = 'StepPlaceHolder';
export { StepPlaceHolder };
