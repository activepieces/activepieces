import React, { useState } from 'react';

import { CardListItemSkeleton } from '@/components/custom/card-list';
import { Separator } from '@/components/ui/separator';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/lib/piece-selector-tabs-provider';
import {
  PIECE_SELECTOR_ELEMENTS_HEIGHTS,
  pieceSelectorUtils,
} from '@/features/pieces/lib/piece-selector-utils';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
  CategorizedStepMetadataWithSuggestions,
} from '@/lib/types';
import {
  FlowActionType,
  FlowOperationType,
  FlowTriggerType,
} from '@activepieces/shared';

import { cn } from '../../../lib/utils';
import { useBuilderStateContext } from '../builder-hooks';

import { NoResultsFound } from './no-results-found';
import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';
import { PieceCardListItem } from './piece-card-item';

type PiecesCardListProps = {
  searchQuery: string;
  operation: PieceSelectorOperation;
  stepToReplacePieceDisplayName?: string;
};

export const PiecesCardList: React.FC<PiecesCardListProps> = ({
  searchQuery,
  operation,
  stepToReplacePieceDisplayName,
}) => {
  const isMobile = useIsMobile();
  const [selectedPieceMetadataInPieceSelector] = useBuilderStateContext(
    (state) => [state.selectedPieceMetadataInPieceSelector],
  );
  const { isLoading: isLoadingPieces, data: categories } =
    piecesHooks.usePiecesSearch({
      searchQuery,
      type:
        operation.type === FlowOperationType.UPDATE_TRIGGER
          ? 'trigger'
          : 'action',
    });

  const noResultsFound = !isLoadingPieces && categories.length === 0;
  const [mouseMoved, setMouseMoved] = useState(false);
  const showActionsOrTriggersInsidePiecesList =
    searchQuery.length > 0 || isMobile;
  const virtualizedItems = transformPiecesMetadataToVirtualizedItems(
    categories,
    showActionsOrTriggersInsidePiecesList,
  );

  const initialIndexToScrollToInPiecesList = virtualizedItems.findIndex(
    (item) => item.displayName === stepToReplacePieceDisplayName,
  );
  const { selectedTab } = usePieceSelectorTabs();

  const isLoading = isLoadingPieces;
  const showActionsOrTriggersList =
    searchQuery.length === 0 && !isMobile && !noResultsFound && !isLoading;
  const showPiecesList = !noResultsFound && !isLoading;
  if (selectedTab === PieceSelectorTabType.EXPLORE) {
    return null;
  }
  return (
    <>
      <div
        onMouseMove={() => {
          setMouseMoved(!isLoadingPieces);
        }}
        className={cn('w-full md:w-[250px] md:min-w-[250px] transition-all ', {
          'w-full md:w-full': searchQuery.length > 0 || noResultsFound,
        })}
      >
        {isLoading && (
          <div className="flex flex-col gap-2">
            <CardListItemSkeleton numberOfCards={2} withCircle={false} />
          </div>
        )}

        {showPiecesList && (
          <VirtualizedScrollArea
            key={`${selectedTab}-${searchQuery}`}
            initialScroll={{
              index: initialIndexToScrollToInPiecesList,
              clickAfterScroll: true,
            }}
            items={virtualizedItems}
            estimateSize={(index) => virtualizedItems[index].height}
            getItemKey={(index) => virtualizedItems[index].id}
            renderItem={(item) => {
              if (item.isCategory) {
                return (
                  <div
                    className={cn('p-2 pb-0 text-sm text-muted-foreground')}
                    id={item.displayName}
                  >
                    {item.displayName}
                  </div>
                );
              }
              return (
                <PieceCardListItem
                  pieceMetadata={item.pieceMetadata}
                  searchQuery={searchQuery}
                  operation={operation}
                  isTemporaryDisabledUntilNextCursorMove={!mouseMoved}
                />
              );
            }}
          />
        )}

        {noResultsFound && <NoResultsFound />}
      </div>

      {showActionsOrTriggersList && (
        <>
          <Separator orientation="vertical" className="h-full" />
          <PieceActionsOrTriggersList
            stepMetadataWithSuggestions={selectedPieceMetadataInPieceSelector}
            hidePieceIconAndDescription={false}
            operation={operation}
          />
        </>
      )}
    </>
  );
};

type VirtualizedItem = {
  id: string;
  displayName: string;
  height: number;
} & (
  | {
      isCategory: true;
    }
  | {
      isCategory: false;
      pieceMetadata: StepMetadataWithSuggestions;
    }
);
const transformPiecesMetadataToVirtualizedItems = (
  searchResult: CategorizedStepMetadataWithSuggestions[],
  showActionsOrTriggersInsidePiecesList: boolean,
) => {
  return searchResult.reduce<VirtualizedItem[]>((result, category) => {
    if (!showActionsOrTriggersInsidePiecesList) {
      result.push({
        id: category.title,
        displayName: category.title,
        height: PIECE_SELECTOR_ELEMENTS_HEIGHTS.CATEGORY_ITEM_HEIGHT,
        isCategory: true,
      });
    }
    category.metadata.forEach((pieceMetadata, index) => {
      result.push({
        id: `${pieceMetadata.displayName}-${index}`,
        height: getItemHeight(
          pieceMetadata,
          showActionsOrTriggersInsidePiecesList,
        ),
        isCategory: false,
        pieceMetadata,
        displayName: pieceMetadata.displayName,
      });
    });
    return result;
  }, []);
};

const getItemHeight = (
  pieceMetadata: StepMetadataWithSuggestions,
  showActionsOrTriggersInsidePiecesList: boolean
) => {
  const { ACTION_OR_TRIGGER_ITEM_HEIGHT, PIECE_ITEM_HEIGHT } =
    PIECE_SELECTOR_ELEMENTS_HEIGHTS;
  if (
    pieceMetadata.type === FlowActionType.PIECE &&
    showActionsOrTriggersInsidePiecesList
  ) {
    const actionsListWithoutHiddenActions =
      pieceSelectorUtils.removeHiddenActions(pieceMetadata);
    return (
      ACTION_OR_TRIGGER_ITEM_HEIGHT *
        Object.values(actionsListWithoutHiddenActions).length + PIECE_ITEM_HEIGHT
    );
  }
  if (
    pieceMetadata.type === FlowTriggerType.PIECE &&
    showActionsOrTriggersInsidePiecesList
  ) {
    return (
      ACTION_OR_TRIGGER_ITEM_HEIGHT *
        Object.values(pieceMetadata.suggestedTriggers ?? {}).length +
      PIECE_ITEM_HEIGHT
    );
  }
  const isCoreAction =
    pieceMetadata.type === FlowActionType.CODE ||
    pieceMetadata.type === FlowActionType.LOOP_ON_ITEMS ||
    pieceMetadata.type === FlowActionType.ROUTER;
  if (isCoreAction && showActionsOrTriggersInsidePiecesList) {
    return ACTION_OR_TRIGGER_ITEM_HEIGHT + PIECE_ITEM_HEIGHT;
  }
  return PIECE_ITEM_HEIGHT;
};