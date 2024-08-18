import React from 'react';

import { StepMetadata } from '../lib/pieces-hook';

import { cn } from '@/lib/utils';

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
        <img
          src={piece.logoUrl}
          alt={piece.displayName}
          className="size-[48px] object-contain"
        />
      </div>
      <div className="flex h-full grow flex-col justify-center gap-1 text-start">
        <div className="text-base ">{piece.displayName}</div>
        <div className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
          {piece.description}
        </div>
      </div>
    </div>
  );
};

export { PieceCardInfo };
