import { Handle, Position } from '@xyflow/react';
import React from 'react';

const ApBigButton = React.memo(() => {
  return (
    <>
      <div className="h-[70px] w-[260px] rounded border border-solid bg-background px-2 ">
        <p>BIG BUTTON</p>
      </div>

      <Handle type="source" style={{ opacity: 0 }} position={Position.Bottom} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </>
  );
});

ApBigButton.displayName = 'ApBigButton';
export { ApBigButton };
