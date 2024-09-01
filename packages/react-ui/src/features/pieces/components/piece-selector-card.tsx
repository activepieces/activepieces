import React from 'react';

import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { cn } from '@/lib/utils';
import { ActionType, TriggerType } from '@activepieces/shared';

import { PieceStepMetadata, StepMetadata } from '../lib/pieces-hook';

type PieceCardInfoProps = {
  piece: StepMetadata;
  interactive: boolean;
  onClick?: () => void;
};

const PieceCardInfo: React.FC<PieceCardInfoProps> = ({
  piece,
  interactive,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-4 rounded border border-solid p-3.5',
        {
          'cursor-pointer hover:bg-accent hover:text-accent-foreground':
            interactive,
        },
      )}
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
          <div className="flex-grow">{piece.displayName}</div>
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
