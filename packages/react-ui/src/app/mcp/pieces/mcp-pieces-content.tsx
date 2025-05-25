import { t } from 'i18next';
import React from 'react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/lib/types';

interface McpPiecesContentProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isPiecesLoading: boolean;
  pieceMetadata: PieceStepMetadataWithSuggestions[];
  addedPieces: PieceStepMetadataWithSuggestions[];
  otherPieces: PieceStepMetadataWithSuggestions[];
  onPieceSelect: (piece: PieceStepMetadataWithSuggestions) => void;
}

export const McpPiecesContent: React.FC<McpPiecesContentProps> = ({
  searchQuery,
  onSearchChange,
  isPiecesLoading,
  pieceMetadata,
  addedPieces,
  otherPieces,
  onPieceSelect,
}) => {
  return (
    <div className="flex flex-col h-[calc(100vh-300px)] overflow-y-auto">
      <div className="mb-4">
        <Input
          placeholder={t('Search')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {isPiecesLoading && (
        <div className="flex items-center justify-center w-full flex-1">
          <LoadingSpinner />
        </div>
      )}
      {!isPiecesLoading && pieceMetadata && pieceMetadata.length === 0 && (
        <div className="text-center flex-1 flex items-center justify-center">
          {t('No pieces found')}
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="pr-4">
          {addedPieces.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">{t('Added Tools')}</h3>
              <div className="grid grid-cols-4 gap-4">
                {addedPieces.map((piece, index) => (
                  <div
                    key={index}
                    onClick={() => onPieceSelect(piece)}
                    className="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg relative"
                  >
                    <img
                      className="w-[40px] h-[40px]"
                      src={piece.logoUrl}
                      alt={piece.displayName}
                    />
                    <div className="mt-2 text-center text-md">
                      {piece.displayName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherPieces.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {addedPieces.length > 0 ? t('Other Tools') : t('Tools')}
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {otherPieces.map((piece, index) => (
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
                    <div className="mt-2 text-center text-md">
                      {piece.displayName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
