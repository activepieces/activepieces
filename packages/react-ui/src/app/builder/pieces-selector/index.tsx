import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { SearchInput } from '../../../components/ui/search-input';
import { PiecesCardList } from './pieces-card-list';
import { FlowOperationType, TriggerType } from '@activepieces/shared';
import PieceSelectorIntro from './piece-selector-intro';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { PieceTagType, PieceSelectorOperation } from '@/lib/types';
import { PieceTagsList } from './piece-tag';

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
    state.flowVersion.trigger.type === TriggerType.EMPTY,
  ]);
  const isForReplace = operation.type === FlowOperationType.UPDATE_ACTION || operation.type === FlowOperationType.UPDATE_TRIGGER;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedPieceGroupType, setSelectedPieceGroupType] = useState<PieceTagType | null>(isForReplace && !isForEmptyTrigger? PieceTagType.ALL : null);
  const isOpen = openedPieceSelectorStepNameOrAddButtonId === id;
  const { listHeightRef, popoverTriggerRef } =
    pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace();
  const showPiecesList = selectedPieceGroupType || searchQuery.length > 0;
  return (
    <Popover
      open={isOpen}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          setSearchQuery('');
          setOpenedPieceSelectorStepNameOrAddButtonId(null);
          setSelectedPieceMetadataInPieceSelector(null);
          setSelectedPieceGroupType(isForReplace && !isForEmptyTrigger? PieceTagType.ALL : null);
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
            <div
              className="p-2 flex-col  gap-1 items-center "
            >
              <SearchInput
                placeholder="Search"
                value={searchQuery}
                showDeselect={false}
                showBackButton={selectedPieceGroupType !== null }
                onChange={(e) => {
                  setSearchQuery(e);
                  setSelectedPieceMetadataInPieceSelector(null);
                  if(e === '')
                  {
                    setSelectedPieceGroupType(null);
                  }
                  else
                  {
                    setSelectedPieceGroupType(PieceTagType.ALL);
                  }
                }}
              />
             {(searchQuery.length > 0 || selectedPieceGroupType !== null) && <PieceTagsList />}
            </div>

            <Separator orientation="horizontal" />
          </div>
          <div
            className=" flex flex-row overflow-y-auto max-h-[300px] h-[300px] "
            style={{
              height: listHeightRef.current + 'px',
            }}
          > 
           {
            !showPiecesList && <PieceSelectorIntro setSelectedPieceGroupType={setSelectedPieceGroupType}/>
           }

            { showPiecesList &&
              <PiecesCardList
              key={debouncedQuery}
              searchQuery={debouncedQuery}
              operation={operation}
              selectedPieceGroupType={selectedPieceGroupType}
              stepToReplacePieceDisplayName={stepToReplacePieceDisplayName}
            />
            }
            
            
          </div>
        </>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };
