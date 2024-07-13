import { Handle, Position } from '@xyflow/react';
import { Action, Trigger } from '@activepieces/shared';
import React from 'react';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';

const ApStepNode = React.memo(({ data }: { data: Action | Trigger }) => {

    const { data: piece } = piecesHooks.usePiece({ name: data.settings.pieceName, version: data.settings.pieceVersion });

    return (
        <div className="h-[70px] border-solid border-[#c2c9d1] border bg-white border-[1px] w-[260px] rounded px-2 ">
            <div className='flex gap-4 items-center justify-between h-full g4'>
                <div className='justify-center items-center'>
                    <img
                        src={piece?.logoUrl}
                        width="46"
                        height="46"
                    />
                </div>
                <div className='flex-grow'>
                    <div className="text-xs">
                        {data.displayName}
                    </div>
                    <div className="text-xs text-gray-500">
                        Send a message to a webhook
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                style={{ opacity: 0 }}
                position={Position.Bottom}
            />
            <Handle
                type="target"
                position={Position.Top}
                style={{ opacity: 0 }}
            />


        </div>
    )
})

export { ApStepNode };