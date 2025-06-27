import React, { useEffect, useRef, useState } from 'react';

import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { Separator } from '@/components/ui/separator';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  PieceTagType,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
  tagCategoryName,
} from '@/lib/types';
import { FlowOperationType, isNil } from '@activepieces/shared';

import { cn, scrollToElementAndClickIt, wait } from '../../../lib/utils';
import { useBuilderStateContext } from '../builder-hooks';

import { NoResultsFound } from './no-results-found';
import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

type PiecesCardListProps = {
  searchQuery: string;
  operation: PieceSelectorOperation;
  selectedPieceGroupType: PieceTagType | null;
  stepToReplacePieceDisplayName?: string;
};

export const PiecesCardList: React.FC<PiecesCardListProps> = ({
  searchQuery,
  operation,
  selectedPieceGroupType,
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
  const hasScrolledToElement = useRef(false);
  const [mouseMoved, setMouseMoved] = useState(false);
  useEffect(() => {
    if (hasScrolledToElement.current || isLoadingPieces) {
      return;
    }
    const categoryNameOrPieceDisplayNameToScrollTo =
      findInitiallyScrolledToCategoryOrPieceDisplayName(
        selectedPieceGroupType,
        selectedPieceMetadataInPieceSelector,
        stepToReplacePieceDisplayName,
      );
    if (!isNil(categoryNameOrPieceDisplayNameToScrollTo)) {
      scrollToElementAndClickIt(categoryNameOrPieceDisplayNameToScrollTo);
    }
    hasScrolledToElement.current = true;
  }, [isLoadingPieces, selectedPieceMetadataInPieceSelector?.displayName]);

  return (
    <>
      <CardList
        onMouseMove={() => {
          setMouseMoved(!isLoadingPieces);
        }}
        className={cn('w-full md:w-[250px] md:min-w-[250px] transition-all ', {
          'w-full md:w-full': searchQuery.length > 0 || noResultsFound,
        })}
        listClassName="gap-0"
      >
        {isLoadingPieces && (
          <div className="flex flex-col gap-2">
            <CardListItemSkeleton numberOfCards={2} withCircle={false} />
          </div>
        )}

        {!isLoadingPieces &&
          !noResultsFound &&
          categories.map((category, categoryIndex) => (
            <React.Fragment key={`${category.title}-${categoryIndex}`}>
              {searchQuery.length === 0 && (
                <div
                  className="pl-3 text-sm text-muted-foreground"
                  id={category.title}
                >
                  {category.title}
                </div>
              )}
              {category.metadata.map((pieceMetadata, metadataIndex) => (
                <PieceCardListItem
                  isDisabled={!mouseMoved}
                  key={`${pieceMetadata.displayName}-${metadataIndex}`}
                  pieceMetadata={pieceMetadata}
                  searchQuery={searchQuery}
                  operation={operation}
                />
              ))}
            </React.Fragment>
          ))}

        {noResultsFound && <NoResultsFound />}
      </CardList>

      {searchQuery.length === 0 &&
        !isLoadingPieces &&
        categories.length > 0 &&
        !isMobile && (
          <>
            <Separator orientation="vertical" className="h-full" />
            <PieceActionsOrTriggersList
              stepMetadataWithSuggestions={selectedPieceMetadataInPieceSelector}
              hidePieceIcon={false}
              operation={operation}
            />
          </>
        )}
    </>
  );
};

type PieceCardListItemProps = {
  pieceMetadata: StepMetadataWithSuggestions;
  searchQuery: string;
  operation: PieceSelectorOperation;
  isDisabled: boolean;
};

const PieceCardListItem = ({
  pieceMetadata,
  searchQuery,
  operation,
  isDisabled,
}: PieceCardListItemProps) => {
  const isMobile = useIsMobile();
  const showSuggestions = searchQuery.length > 0 || isMobile;
  const isMouseOver = useRef(false);
  const selectPieceMetatdata = async () => {
    if (isDisabled) {
      return;
    }
    isMouseOver.current = true;
    await wait(250);
    if (isMouseOver.current) {
      setSelectedPieceMetadataInPieceSelector(pieceMetadata);
    }
  };
  const [
    selectedPieceMetadataInPieceSelector,
    setSelectedPieceMetadataInPieceSelector,
  ] = useBuilderStateContext((state) => [
    state.selectedPieceMetadataInPieceSelector,
    state.setSelectedPieceMetadataInPieceSelector,
  ]);

  return (
    <>
      <CardListItem
        className={cn('flex-col p-3 gap-1 items-start', {
          'hover:!bg-transparent': isDisabled,
        })}
        selected={
          selectedPieceMetadataInPieceSelector?.displayName ===
            pieceMetadata.displayName && searchQuery.length === 0
        }
        interactive={!showSuggestions}
        onMouseEnter={selectPieceMetatdata}
        onMouseMove={selectPieceMetatdata}
        onClick={() => setSelectedPieceMetadataInPieceSelector(pieceMetadata)}
        onMouseLeave={() => {
          isMouseOver.current = false;
        }}
        id={pieceMetadata.displayName}
      >
        <div className="flex gap-2 items-center h-full">
          <PieceIcon
            logoUrl={pieceMetadata.logoUrl}
            displayName={pieceMetadata.displayName}
            showTooltip={false}
            size={'sm'}
          />
          <div className="flex-grow h-full flex items-center justify-left text-sm">
            {pieceMetadata.displayName}
          </div>
        </div>
      </CardListItem>

      {showSuggestions && (
        <div>
          <PieceActionsOrTriggersList
            stepMetadataWithSuggestions={pieceMetadata}
            hidePieceIcon={true}
            operation={operation}
          />
        </div>
      )}
    </>
  );
};

PieceCardListItem.displayName = 'PieceCardListItem';
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
