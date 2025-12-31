import { t } from 'i18next';
import { Search } from 'lucide-react';
import React from 'react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';

interface PiecesContentProps {
  isPiecesLoading: boolean;
  pieceMetadata: PieceStepMetadataWithSuggestions[];
  onPieceSelect: (piece: PieceStepMetadataWithSuggestions) => void;
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
}

export const PiecesList: React.FC<PiecesContentProps> = ({
  isPiecesLoading,
  pieceMetadata,
  onPieceSelect,
  searchQuery,
  setSearchQuery,
}) => {
  const isEmpty = !isPiecesLoading && pieceMetadata.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <div className="relative border rounded-sm">
          <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t('Search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 shadow-none border-none"
          />
        </div>
      </div>

      {isPiecesLoading ? (
        <div className="grid grid-cols-3 gap-4 p-4">
          {Array.from({ length: 22 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="h-full flex items-center py-2 justify-center text-muted-foreground">
          {t('No pieces found')}
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 px-4 py-2">
          <div className="grid grid-cols-3 gap-4">
            {pieceMetadata.map((piece, index) => (
              <div
                key={index}
                onClick={() => onPieceSelect(piece)}
                className="p-2 flex items-center gap-x-2 hover:bg-accent cursor-pointer rounded-lg"
              >
                <div className="size-9 flex items-center justify-center rounded-sm aspect-square border bg-background">
                  <img
                    className="size-6 rounded object-contain"
                    src={piece.logoUrl}
                    alt={piece.displayName}
                  />
                </div>

                <p className="font-semibold text-sm">{piece.displayName}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
