import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { FlowOperationType } from '@activepieces/shared';

import { SearchInput } from '../../../components/ui/search-input';

import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';
import { PiecesCardList } from './pieces-card-list';

import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { PieceSelectorOperation } from '@/lib/types';

type PieceSelectorProps = {
  children: React.ReactNode;
  id: string;
  operation: PieceSelectorOperation;
  initiallySelectedPieceMetadataName?: string;
  openSelectorOnClick?: boolean;
};

const PieceSelector = ({
  children,
  operation,
  id,
  initiallySelectedPieceMetadataName,
  openSelectorOnClick = true,
}: PieceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const isTrigger = operation.type === FlowOperationType.UPDATE_TRIGGER;
  const { isLoading: isLoadingPieces, data: pieceGroups } =
    piecesHooks.usePiecesGroups({
      searchQuery: debouncedQuery,
      type: isTrigger ? 'trigger' : 'action',
    });
  const piecesIsLoaded = !isLoadingPieces && pieceGroups.length > 0;
  const noResultsFound = !isLoadingPieces && pieceGroups.length === 0;
  const [
    openedPieceSelectorId,
    setOpenedPieceSelectorId,
    hoveredPieceMetadata,
    setHoveredPieceMetadata,
  ] = useBuilderStateContext((state) => [
    state.openedPieceSelectorStepNameOrAddButtonId,
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
    state.hoveredPieceMetadata,
    state.setHoveredPieceMetadata,
  ]);
  const isMobile = useIsMobile();
  const isOpen = openedPieceSelectorId === id;
  const { listHeightRef, popoverTriggerRef, searchInputDivHeight } =
    pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace();

  return (
    <Popover
      open={isOpen}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          setSearchQuery('');
          setOpenedPieceSelectorId(null);
          setHoveredPieceMetadata(null);
        }
      }}
    >
      <PopoverTrigger
        ref={popoverTriggerRef}
        asChild={true}
        onClick={() => {
          if (openSelectorOnClick) {
            setOpenedPieceSelectorId(id);
          }
        }}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        onContextMenu={(e) => {
          e.stopPropagation();
        }}
        className="w-[340px] md:w-[600px] p-0 shadow-lg"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <>
          <div>
            <div
              className="p-2 flex gap-1 items-center"
              style={{
                height: `${searchInputDivHeight}px`,
              }}
            >
              <SearchInput
                placeholder="Search"
                value={searchQuery}
                showDeselect={searchQuery.length > 0}
                onChange={(e) => {
                  setSearchQuery(e);
                  setHoveredPieceMetadata(null);
                }}
              />
            </div>

            <Separator orientation="horizontal" />
          </div>
          <div
            className=" flex flex-row overflow-y-auto max-h-[300px] h-[300px] "
            style={{
              height: listHeightRef.current + 'px',
            }}
          >
            <PiecesCardList
              searchQuery={debouncedQuery}
              piecesIsLoaded={piecesIsLoaded}
              noResultsFound={noResultsFound}
              operation={operation}
              pieceGroups={pieceGroups}
              isLoadingPieces={isLoadingPieces}
              initiallySelectedPieceMetadataName={
                initiallySelectedPieceMetadataName
              }
            />
            {debouncedQuery.length === 0 &&
              piecesIsLoaded &&
              !noResultsFound &&
              !isMobile && (
                <>
                  <Separator orientation="vertical" className="h-full" />
                  <PieceActionsOrTriggersList
                    stepMetadataWithSuggestions={hoveredPieceMetadata}
                    hidePieceIcon={false}
                    operation={operation}
                  />
                </>
              )}
          </div>
        </>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };
