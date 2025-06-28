import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { PieceTagType, PieceSelectorOperation } from '@/lib/types';
import { FlowOperationType, TriggerType } from '@activepieces/shared';

import { SearchInput } from '../../../components/ui/search-input';

import PieceSelectorIntro from './piece-selector-intro';
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
  ] = useBuilderStateContext((state) => [
    state.openedPieceSelectorStepNameOrAddButtonId,
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
    state.setSelectedPieceMetadataInPieceSelector,
    state.flowVersion.trigger.type === TriggerType.EMPTY && id === 'trigger',
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
  const { listHeightRef, popoverTriggerRef } =
    pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace();
  const showPiecesList = selectedPieceGroupType || searchQuery.length > 0;
  const listHeight = Math.min(listHeightRef.current, 300);
  return (
    <Popover
      open={isOpen}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          setSearchQuery('');
          setOpenedPieceSelectorStepNameOrAddButtonId(null);
          setSelectedPieceMetadataInPieceSelector(null);
          setSelectedPieceGroupType(initiallySelectedPieceGroupType);
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
            <div className="p-2 flex-col  gap-1 items-center ">
              <SearchInput
                placeholder="Search"
                value={searchQuery}
                showDeselect={false}
                showBackButton={selectedPieceGroupType !== null}
                onChange={(e) => {
                  setSearchQuery(e);
                  setSelectedPieceMetadataInPieceSelector(null);
                  if (e === '') {
                    setSelectedPieceGroupType(null);
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
            {!showPiecesList && (
              <PieceSelectorIntro
                isForTrigger={
                  operation.type === FlowOperationType.UPDATE_TRIGGER
                }
                setSelectedPieceGroupType={setSelectedPieceGroupType}
              />
            )}

            {showPiecesList && (
              <PiecesCardList
                listHeight={listHeight}
                key={debouncedQuery}
                searchQuery={debouncedQuery}
                operation={operation}
                selectedPieceGroupType={selectedPieceGroupType}
                stepToReplacePieceDisplayName={stepToReplacePieceDisplayName}
              />
            )}
          </div>
        </>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };
