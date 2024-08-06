import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { ApNode } from '../flow-canvas-utils';
import { useBuilderStateContext } from '../../builder-hooks';

const ApBigButton = React.memo(({ data }: { data: ApNode['data'] }) => {

  const [clickOnNewNodeButton] = useBuilderStateContext((state) => [state.clickOnNewNodeButton,]);
  
  return (
    <>
      <div className="h-[70px] w-[260px] border border-solid border-none flex items-center justify-center ">
        <div className="w-[50px] h-[50px] bg-accent rounded" onClick={() => clickOnNewNodeButton('action', data.parentStep!, data.stepLocationRelativeToParent!)}>
          <Button variant="ghost" className="w-full h-full">
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
