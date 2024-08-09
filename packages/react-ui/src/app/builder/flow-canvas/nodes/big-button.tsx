import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../../builder-hooks';
import { ApNode } from '../flow-canvas-utils';

const ApBigButton = React.memo(({ data }: { data: ApNode['data'] }) => {
  const [clickOnNewNodeButton, readonly] = useBuilderStateContext((state) => [
    state.clickOnNewNodeButton,
    state.readonly,
  ]);

  return (
    <>
      <div className="h-[70px] w-[260px] border border-solid border-none flex items-center justify-center ">
        <div
          className="w-[50px] h-[50px] bg-accent rounded"
          onClick={() =>
            clickOnNewNodeButton(
              'action',
              data.parentStep!,
              data.stepLocationRelativeToParent!,
            )
          }
        >
          <Button variant="ghost" className="w-full h-full" disabled={readonly}>
            <Plus className="w-6 h-6 text-accent-foreground" />
          </Button>
        </div>
      </div>

      <Handle type="source" style={{ opacity: 0 }} position={Position.Bottom} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </>
  );
});

ApBigButton.displayName = 'ApBigButton';
export { ApBigButton };
