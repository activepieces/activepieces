import { Search01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/types';

import { usePieceToolsDialogStore } from '../../stores/pieces-tools';

interface PiecesContentProps {
  isPiecesLoading: boolean;
  pieceMetadata: PieceStepMetadataWithSuggestions[];
}

export const PiecesList: React.FC<PiecesContentProps> = ({
  isPiecesLoading,
  pieceMetadata,
}) => {
  const { searchQuery, setSearchQuery, handlePieceSelect } =
    usePieceToolsDialogStore();
  const isEmpty = !isPiecesLoading && pieceMetadata.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <div className="relative border rounded-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2 top-2.5 size-4 text-gray-11"
          />
          <Input
            placeholder={t('Search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 shadow-none border-none"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-4 py-2">
        {isPiecesLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 22 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="h-full flex items-center py-2 justify-center text-gray-11">
            {t('No pieces found')}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {pieceMetadata.map((piece, index) => (
              <div
                key={index}
                onClick={() => handlePieceSelect(piece)}
                className="p-2 flex items-center gap-x-2 hover:bg-gray-4 cursor-pointer rounded-lg"
              >
                <LogoPlate
                  className="size-9 rounded-sm p-1.5"
                  border
                  src={piece.logoUrl}
                  alt={piece.displayName}
                />

                <p className="font-semibold text-sm">{piece.displayName}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
