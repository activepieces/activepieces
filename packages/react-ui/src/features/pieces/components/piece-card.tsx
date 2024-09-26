import React from 'react';

import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { ActionType, TriggerType } from '@activepieces/shared';

import { PieceStepMetadata, StepMetadata } from '../lib/types';

type PieceCardInfoProps = {
  piece: StepMetadata;
  onClick?: () => void;
  actionOrTriggerDisplayName?: string | null;
};

const PieceCardInfo: React.FC<PieceCardInfoProps> = ({
  piece,
  onClick,
  actionOrTriggerDisplayName,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center gap-4 rounded border border-solid p-3.5"
    >
      <div className="flex h-full min-w-[48px] items-center justify-center">
        <PieceIcon
          logoUrl={piece.logoUrl}
          displayName={piece.displayName}
          showTooltip={false}
          border={false}
          size={'xl'}
        ></PieceIcon>
      </div>
      <div className="flex h-full grow flex-col justify-center gap-1 text-start">
        <div className="text-base flex justify-center">
          <div className="flex-grow">
            {piece.displayName}{' '}
            {actionOrTriggerDisplayName
              ? `(${actionOrTriggerDisplayName})`
              : ''}
          </div>
          {(piece.type === ActionType.PIECE ||
            piece.type === TriggerType.PIECE) && (
            <div className="text-xs text-muted-foreground flex justify-center items-center">
              v{(piece as PieceStepMetadata).pieceVersion}
            </div>
          )}
        </div>
        <div className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
          {piece.description}
        </div>
      </div>
    </div>
  );
};

export { PieceCardInfo };
