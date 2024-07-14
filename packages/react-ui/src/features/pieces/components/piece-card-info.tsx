import React from 'react';

import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

type PieceCardInfoProps = {
  piece: PieceMetadataModelSummary;
};

const PieceCardInfo: React.FC<PieceCardInfoProps> = ({ piece }) => {
  return (
    <div className="flex h-[110px] cursor-pointer items-center justify-center gap-4 rounded border border-solid p-4 hover:bg-accent hover:text-accent-foreground">
      <div className="flex h-full min-w-[48px] items-center justify-center">
        <img
          src={piece.logoUrl}
          alt={piece.displayName}
          className="size-[48px] object-contain"
        />
      </div>
      <div className="flex h-full grow flex-col gap-1">
        <div className="text-base ">{piece.displayName}</div>
        <div className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
          {piece.description}
        </div>
      </div>
    </div>
  );
};

export { PieceCardInfo };
