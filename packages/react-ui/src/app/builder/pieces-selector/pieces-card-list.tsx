import React, { useEffect, useRef } from 'react';

import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { Separator } from '@/components/ui/separator';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { useIsMobile } from '@/hooks/use-mobile';
import { isNil } from '@activepieces/shared';

import { cn, wait } from '../../../lib/utils';
import { useBuilderStateContext } from '../builder-hooks';

import { NoResultsFound } from './no-results-found';
import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

import {
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/lib/types';

type PieceGroup = {
  title: string;
  pieces: StepMetadataWithSuggestions[];
};

type PiecesCardListProps = {
  searchQuery: string;
  operation: PieceSelectorOperation;
  pieceGroups: PieceGroup[];
  isLoadingPieces: boolean;
  piecesIsLoaded: boolean;
  noResultsFound: boolean;
  initiallySelectedPieceMetadataName?: string;
};

export const PiecesCardList: React.FC<PiecesCardListProps> = ({
  isLoadingPieces,
  initiallySelectedPieceMetadataName,
  searchQuery,
  noResultsFound,
  operation,
  pieceGroups,
}) => {
  useEffect(() => {
    if (!isNil(initiallySelectedPieceMetadataName) && !isLoadingPieces) {
      const element = document.getElementById(
        initiallySelectedPieceMetadataName,
      );
      element?.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
      });
      element?.click();
    }
  }, [isLoadingPieces]);
  return (
    <CardList
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
        pieceGroups.map((group, index) => (
          <React.Fragment key={group.title}>
            {index > 0 && (
              <div className="my-1">
                <Separator />
              </div>
            )}
            {pieceGroups.length > 1 && (
              <div className="text-sm text-muted-foreground mx-2 mt-2">
                {group.title}
              </div>
            )}

            {group.pieces.map((pieceMetadata, index) => (
              <PieceCardListItem
                key={index}
                pieceMetadata={pieceMetadata}
                searchQuery={searchQuery}
                operation={operation}
              />
            ))}
          </React.Fragment>
        ))}

      {noResultsFound && <NoResultsFound />}
    </CardList>
  );
};

type PieceCardListItemProps = {
  pieceMetadata: StepMetadataWithSuggestions;
  searchQuery: string;
  operation: PieceSelectorOperation;
};

const PieceCardListItem = ({
  pieceMetadata,
  searchQuery,
  operation,
}: PieceCardListItemProps) => {
  const isMobile = useIsMobile();
  const showSuggestions = searchQuery.length > 0 || isMobile;
  const isMouseOver = useRef(false);
  const selectPieceMetatdata = async () => {
    isMouseOver.current = true;
    await wait(250);
    if (isMouseOver.current) {
      setHoveredPieceMetadata(pieceMetadata);
    }
  };
  const [hoveredPieceMetadata, setHoveredPieceMetadata] =
    useBuilderStateContext((state) => [
      state.hoveredPieceMetadata,
      state.setHoveredPieceMetadata,
    ]);
  return (
    <>
      <CardListItem
        className="flex-col p-3 gap-1 items-start"
        selected={
          hoveredPieceMetadata?.displayName === pieceMetadata.displayName &&
          searchQuery.length === 0
        }
        interactive={!showSuggestions}
        onMouseEnter={selectPieceMetatdata}
        onClick={selectPieceMetatdata}
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
