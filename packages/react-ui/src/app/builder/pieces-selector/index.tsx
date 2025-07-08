import { ArrowLeft } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PieceTagType, PieceSelectorOperation } from '@/lib/types';
import { FlowOperationType, TriggerType } from '@activepieces/shared';

import { SearchInput } from '../../../components/ui/search-input';

import { PiecesCardList } from './pieces-card-list';

type PieceSelectorProps = {
  children: React.ReactNode;
  id: string;
  operation: PieceSelectorOperation;
  openSelectorOnClick?: boolean;
  stepToReplacePieceDisplayName?: string;
};

const PieceSelector = ({
  children,
  operation,
  id,
  openSelectorOnClick = true,
  stepToReplacePieceDisplayName,
}: PieceSelectorProps) => {
  const [
    openedPieceSelectorStepNameOrAddButtonId,
    setOpenedPieceSelectorStepNameOrAddButtonId,
    setSelectedPieceMetadataInPieceSelector,
    isForEmptyTrigger,
    deselectStep,
  ] = useBuilderStateContext((state) => [
    state.openedPieceSelectorStepNameOrAddButtonId,
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
    state.setSelectedPieceMetadataInPieceSelector,
    state.flowVersion.trigger.type === TriggerType.EMPTY && id === 'trigger',
    state.deselectStep,
  ]);
  const isForReplace =
    operation.type === FlowOperationType.UPDATE_ACTION ||
    operation.type === FlowOperationType.UPDATE_TRIGGER;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const initiallySelectedPieceGroupType =
    isForReplace && !isForEmptyTrigger ? PieceTagType.ALL : null;
  const [selectedPieceGroupType, setSelectedPieceGroupType] =
    useState<PieceTagType | null>(initiallySelectedPieceGroupType);
  const isOpen = openedPieceSelectorStepNameOrAddButtonId === id;
  const isMobile = useIsMobile();
  const { listHeightRef, popoverTriggerRef } =
    pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace();

  const listHeight = Math.min(listHeightRef.current, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen]);
  const showBackButton = selectedPieceGroupType !== null && !isMobile;
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedPieceMetadataInPieceSelector(null);
    setSelectedPieceGroupType(null);
  };
  return (
    <Popover
      open={isOpen}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          clearSearch();
          setSelectedPieceGroupType(initiallySelectedPieceGroupType);
          setOpenedPieceSelectorStepNameOrAddButtonId(null);
          if (isForEmptyTrigger) {
            deselectStep();
          }
        }
      }}
    >
      <PopoverTrigger
        ref={popoverTriggerRef}
        asChild={true}
        onClick={() => {
          if (openSelectorOnClick) {
            setOpenedPieceSelectorStepNameOrAddButtonId(id);
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
            <div className="p-2 flex  items-center ">
              {showBackButton && (
                <Button variant="ghost" size="icon" onClick={clearSearch}>
                  <ArrowLeft className="size-4 shrink-0"></ArrowLeft>
                </Button>
              )}
              <SearchInput
                placeholder="Search"
                value={searchQuery}
                showDeselect={false}
                showBackButton={selectedPieceGroupType !== null}
                ref={searchInputRef}
                onChange={(e) => {
                  setSearchQuery(e);
                  setSelectedPieceMetadataInPieceSelector(null);
                  if (e === '') {
                    clearSearch();
                  } else {
                    setSelectedPieceGroupType(PieceTagType.ALL);
                  }
                }}
              />
            </div>

            <Separator orientation="horizontal" />
          </div>
          <div
            className=" flex flex-row max-h-[300px] h-[300px] "
            style={{
              height: listHeight + 'px',
            }}
          >
              <PiecesCardList
                listHeight={listHeight}
                //need to add the id to the key to force a re-render the virtualized list
                key={`${debouncedQuery}-${id}`}
                searchQuery={debouncedQuery}
                operation={operation}
                selectedPieceGroupType={selectedPieceGroupType}
                stepToReplacePieceDisplayName={
                  isMobile ? undefined : stepToReplacePieceDisplayName
                }
                />
   
          </div>
        </>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };
