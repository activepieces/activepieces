import { Handle, Position } from '@xyflow/react';
import React from 'react';

import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { Action, Trigger } from '@activepieces/shared';
import { useBuilderStateContext } from '@/hooks/builder-hooks';

const ApStepNode = React.memo(({ data }: { data: Action | Trigger }) => {

  const selectStep = useBuilderStateContext((state) => state.selectStep);
  const { data: pieceMetadata } = piecesHooks.usePieceMetadata({
    step: data,
  });

  const handleClick = () => {
    // TODO handle nestted steps
    console.log("select step from builder")
    selectStep({ path: [], stepName: data.name });
  };

  return (
    <div
      className="h-[70px] w-[260px] rounded border border-solid bg-background px-2 hover:bg-accent hover:text-accent-foreground"
      onClick={() => handleClick()}
    >
      <div className="g4 flex h-full items-center justify-between gap-4">
        <div className="items-center justify-center">
          <img src={pieceMetadata?.logoUrl} width="46" height="46" />
        </div>
        <div className="grow">
          <div className="text-xs">{data.displayName}</div>
          <div className="text-xs text-muted-foreground">
            Send a message to a webhook
          </div>
        </div>
      </div>

      <Handle type="source" style={{ opacity: 0 }} position={Position.Bottom} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  );
});

ApStepNode.displayName = 'ApStepNode';
export { ApStepNode };
