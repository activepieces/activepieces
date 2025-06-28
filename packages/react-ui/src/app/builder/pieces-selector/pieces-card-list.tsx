import React, { useRef, useState } from 'react';

import { CardListItemSkeleton } from '@/components/custom/card-list';
import { Separator } from '@/components/ui/separator';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  PieceTagType,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
  tagCategoryName,
  CategorizedStepMetadataWithSuggestions,
} from '@/lib/types';
import {
  ActionType,
  FlowOperationType,
  isNil,
  TriggerType,
} from '@activepieces/shared';

import { cn } from '../../../lib/utils';
import { useBuilderStateContext } from '../builder-hooks';

import { NoResultsFound } from './no-results-found';
import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';
import { PieceCardListItem } from './piece-card-item';

type PiecesCardListProps = {
  searchQuery: string;
  operation: PieceSelectorOperation;
  selectedPieceGroupType: PieceTagType | null;
  stepToReplacePieceDisplayName?: string;
  listHeight: number;
};

export const PiecesCardList: React.FC<PiecesCardListProps> = ({
  searchQuery,
  operation,
  selectedPieceGroupType,
  stepToReplacePieceDisplayName,
  listHeight,
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
  const virtualizedItems = transformPiecesMetadataToVirtualizedItems(
    categories,
    searchQuery.length > 0 || isMobile,
  );
  const categoryNameOrPieceDisplayNameToScrollTo =
    findInitiallyScrolledToCategoryOrPieceDisplayName(
      selectedPieceGroupType,
      selectedPieceMetadataInPieceSelector,
      stepToReplacePieceDisplayName,
    );
  const initialIndexToScrollToInPiecesListRef = useRef(
    virtualizedItems.findIndex(
      (item) => item.displayName === categoryNameOrPieceDisplayNameToScrollTo,
    ),
  );
  const showActionsOrTriggersList =
    searchQuery.length === 0 &&
    !isMobile &&
    !noResultsFound &&
    !isLoadingPieces;
  const showPiecesList = !noResultsFound && !isLoadingPieces;
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
        {isLoadingPieces && (
          <div className="flex flex-col gap-2">
            <CardListItemSkeleton numberOfCards={2} withCircle={false} />
          </div>
        )}

        {showPiecesList && (
          <VirtualizedScrollArea
            initialScroll={{
              index: initialIndexToScrollToInPiecesListRef.current,
              clickAfterScroll: true,
            }}
            items={virtualizedItems}
            estimateSize={(index) => virtualizedItems[index].height}
            getItemKey={(index) => virtualizedItems[index].id}
            listHeight={listHeight}
            renderItem={(item) => {
              if (item.isCategory) {
                return (
                  <div
                    className="p-2 pb-0 text-sm text-muted-foreground"
                    id={item.displayName}
                  >
                    {item.displayName}
                  </div>
                );
              }
              return (
                <PieceCardListItem
                  pieceMetadata={item}
                  searchQuery={searchQuery}
                  operation={operation}
                  isDisabled={!mouseMoved}
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

const findInitiallyScrolledToCategoryOrPieceDisplayName = (
  selectedPieceGroupType: PieceTagType | null,
  selectedPieceMetadataInPieceSelector: StepMetadataWithSuggestions | null,
  stepToReplacePieceDisplayName: string | undefined,
) => {
  if (
    isNil(selectedPieceMetadataInPieceSelector) &&
    !isNil(stepToReplacePieceDisplayName) &&
    selectedPieceGroupType === PieceTagType.ALL
  ) {
    return stepToReplacePieceDisplayName;
  }
  if (isNil(selectedPieceGroupType)) {
    return null;
  }
  const categoryNameOrPieceDisplayNameToScrollTo =
    selectedPieceGroupType === PieceTagType.ALL
      ? selectedPieceMetadataInPieceSelector?.displayName
      : tagCategoryName[selectedPieceGroupType];
  return categoryNameOrPieceDisplayNameToScrollTo;
};
type VirtualizedItem = {
  id: string;
  displayName: string;
  height: number;
  isCategory: boolean;
};
const transformPiecesMetadataToVirtualizedItems = (
  searchResult: CategorizedStepMetadataWithSuggestions[],
  showActionsOrTriggersInsidePiecesList: boolean,
) => {
  return searchResult.reduce<VirtualizedItem[]>((result, category) => {
    if (!showActionsOrTriggersInsidePiecesList) {
      result.push({
        id: category.title,
        displayName: category.title,
        height: 28,
        isCategory: true,
      });
    }
    category.metadata.forEach((pieceMetadata, index) => {
      result.push({
        id: `${pieceMetadata.displayName}-${index}`,
        ...pieceMetadata,
        height: getItemHeight(
          pieceMetadata,
          showActionsOrTriggersInsidePiecesList,
        ),
        isCategory: false,
      });
    });
    return result;
  }, []);
};

const pieceItemHeight = 48;
const actionOrTriggerItemHeight = 41;
const getItemHeight = (
  pieceMetadata: StepMetadataWithSuggestions,
  showActionsOrTriggersInsidePiecesList: boolean,
) => {
  if (
    pieceMetadata.type === ActionType.PIECE &&
    showActionsOrTriggersInsidePiecesList
  ) {
    return (
      actionOrTriggerItemHeight *
        Object.values(pieceMetadata.suggestedActions ?? {}).length +
      pieceItemHeight
    );
  }
  if (
    pieceMetadata.type === TriggerType.PIECE &&
    showActionsOrTriggersInsidePiecesList
  ) {
    return (
      actionOrTriggerItemHeight *
        Object.values(pieceMetadata.suggestedTriggers ?? {}).length +
      pieceItemHeight
    );
  }
  const isCoreAction =
    pieceMetadata.type === ActionType.CODE ||
    pieceMetadata.type === ActionType.LOOP_ON_ITEMS ||
    pieceMetadata.type === ActionType.ROUTER;
  if (isCoreAction && showActionsOrTriggersInsidePiecesList) {
    return actionOrTriggerItemHeight + pieceItemHeight;
  }
  return pieceItemHeight;
};
