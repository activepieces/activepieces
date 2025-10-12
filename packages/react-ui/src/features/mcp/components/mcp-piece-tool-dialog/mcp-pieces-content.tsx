import { t } from 'i18next';
import React from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';

interface McpPiecesContentProps {
  isPiecesLoading: boolean;
  pieceMetadata: PieceStepMetadataWithSuggestions[];
  onPieceSelect: (piece: PieceStepMetadataWithSuggestions) => void;
}

export const McpPiecesContent: React.FC<McpPiecesContentProps> = ({
  isPiecesLoading,
  pieceMetadata,
  onPieceSelect,
}) => {
  if (isPiecesLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isPiecesLoading && pieceMetadata && pieceMetadata.length === 0) {
    return (
      <div className="text-center h-full flex items-center justify-center">
        {t('No pieces found')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {pieceMetadata.map((piece, index) => (
        <div
          key={index}
          onClick={() => onPieceSelect(piece)}
          className="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg"
        >
          <img
            className="w-[40px] h-[40px]"
            src={piece.logoUrl}
            alt={piece.displayName}
          />
          <div className="mt-2 text-center text-md">{piece.displayName}</div>
        </div>
      ))}
    </div>
  );
};
