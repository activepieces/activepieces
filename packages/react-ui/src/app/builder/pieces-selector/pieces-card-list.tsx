import React, { useEffect, useRef } from 'react';

import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { Separator } from '@/components/ui/separator';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import {
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { isNil } from '@activepieces/shared';

import { cn, wait } from '../../../lib/utils';
import { useBuilderStateContext } from '../builder-hooks';

import { NoResultsFound } from './no-results-found';
import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

type PieceGroup = {
  title: string;
  pieces: StepMetadataWithSuggestions[];
};

type PiecesCardListProps = {
  debouncedQuery: string;
  operation: PieceSelectorOperation;
  pieceGroups: PieceGroup[];
  isLoadingPieces: boolean;
  piecesIsLoaded: boolean;
  noResultsFound: boolean;
  initiallySelectedPieceMetadataName?: string;
};

export const PiecesCardList: React.FC<PiecesCardListProps> = (props) => {
  const { debouncedQuery, isLoadingPieces, noResultsFound, operation } = props;

  return (
    <CardList
      className={cn('w-full md:w-[250px] md:min-w-[250px] transition-all ', {
        'w-full md:w-full': debouncedQuery.length > 0 || noResultsFound,
      })}
      listClassName="gap-0"
    >
      {isLoadingPieces && (
        <div className="flex flex-col gap-2">
          <CardListItemSkeleton numberOfCards={2} withCircle={false} />
        </div>
      )}

      {!isLoadingPieces && !noResultsFound && (
        <PieceCardListWrapper {...props} />
      )}

      {noResultsFound && <NoResultsFound operation={operation} />}
    </CardList>
  );
};

const PieceCardListWrapper = ({
  pieceGroups,
  debouncedQuery,
  operation,
  initiallySelectedPieceMetadataName,
}: PiecesCardListProps) => {
  useEffect(() => {
    if (!isNil(initiallySelectedPieceMetadataName)) {
      const element = document.getElementById(
        initiallySelectedPieceMetadataName,
      );
      element?.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
      });
      element?.click();
    }
  }, []);
  return pieceGroups.map((group, index) => (
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

      {group.pieces.map((pieceMetadata) => (
        <PieceCardListItem
          key={pieceSelectorUtils.toKey(pieceMetadata)}
          pieceMetadata={pieceMetadata}
          debouncedQuery={debouncedQuery}
          operation={operation}
        />
      ))}
    </React.Fragment>
  ));
};

type PieceCardListItemProps = {
  pieceMetadata: StepMetadataWithSuggestions;
  debouncedQuery: string;
  operation: PieceSelectorOperation;
};

const PieceCardListItem = ({
  pieceMetadata,
  debouncedQuery,
  operation,
}: PieceCardListItemProps) => {
  const isMobile = useIsMobile();
  const showSuggestions = debouncedQuery.length > 0 || isMobile;
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
          debouncedQuery.length === 0
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
