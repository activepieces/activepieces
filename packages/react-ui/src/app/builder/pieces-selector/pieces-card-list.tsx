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
  StepMetadata,
  PieceSelectorOperation,
  HandleSelectCallback,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { isNil, TriggerType } from '@activepieces/shared';
import { cn } from '../../../lib/utils';
import { NoResultsFound } from './no-results-found';
import { PieceSearchSuggestions } from './piece-search-suggestions';

type PieceGroup = {
  title: string;
  pieces: StepMetadataWithSuggestions[];
};

type PiecesCardListProps = {
  debouncedQuery: string;
  selectedPieceMetadata: StepMetadata | undefined;
  setSelectedMetadata: (metadata: StepMetadata) => void;
  operation: PieceSelectorOperation;
  handleSelect: HandleSelectCallback;
  pieceGroups: PieceGroup[];
  isLoadingPieces: boolean;
  piecesIsLoaded: boolean;
  noResultsFound: boolean;
  closePieceSelector: () => void;
  hiddenActionsOrTriggers: string[];
};

export const PiecesCardList: React.FC<PiecesCardListProps> = (props) => {
  const {
    debouncedQuery,
    isLoadingPieces,
    noResultsFound,
    operation,
    closePieceSelector,
  } = props;

  return (
    <CardList
      className={cn(' w-full md:w-[250px] md:min-w-[250px] transition-all ', {
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

      {noResultsFound && (
        <NoResultsFound
          operation={operation}
          closePieceSelector={closePieceSelector}
        />
      )}
    </CardList>
  );
};

const PieceCardListWrapper = ({
  pieceGroups,
  hiddenActionsOrTriggers,
  selectedPieceMetadata,
  debouncedQuery,
  setSelectedMetadata,
  handleSelect,
}: PiecesCardListProps) => {
  useEffect(() => {
    if (!isNil(selectedPieceMetadata)) {
      document
        .getElementById(selectedPieceMetadata.displayName)
        ?.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
        });
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
        <div id={pieceMetadata.displayName}>
          <PieceCardListItem
            key={pieceSelectorUtils.toKey(pieceMetadata)}
            hiddenActionsOrTriggers={hiddenActionsOrTriggers}
            pieceMetadata={pieceMetadata}
            selectedPieceMetadata={selectedPieceMetadata}
            debouncedQuery={debouncedQuery}
            setSelectedMetadata={setSelectedMetadata}
            handleSelect={handleSelect}
          />
        </div>
      ))}
    </React.Fragment>
  ));
};

const PieceCardListItem = React.forwardRef<
  HTMLDivElement,
  {
    pieceMetadata: StepMetadataWithSuggestions;
    selectedPieceMetadata: StepMetadata | undefined;
    debouncedQuery: string;
    setSelectedMetadata: (metadata: StepMetadata) => void;
    handleSelect: HandleSelectCallback;
    hiddenActionsOrTriggers: string[];
  }
>(
  (
    {
      pieceMetadata,
      selectedPieceMetadata,
      debouncedQuery,
      setSelectedMetadata,
      handleSelect,
      hiddenActionsOrTriggers,
    },
    ref,
  ) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (element: HTMLDivElement) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (element.matches(':hover')) {
          setSelectedMetadata(pieceMetadata);
        }
      }, 150);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    const isMobile = useIsMobile();
    return (
      <div onMouseLeave={handleMouseLeave} ref={ref}>
        <CardListItem
          className="flex-col p-3 gap-1 items-start"
          selected={
            pieceMetadata.displayName === selectedPieceMetadata?.displayName &&
            debouncedQuery.length === 0
          }
          interactive={debouncedQuery.length === 0}
          onMouseEnter={(e) => handleMouseEnter(e.currentTarget)}
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

        {(debouncedQuery.length > 0 || isMobile) &&
          pieceMetadata.type !== TriggerType.EMPTY && (
            <div onMouseEnter={(e) => handleMouseEnter(e.currentTarget)}>
              <PieceSearchSuggestions
                hiddenActionsOrTriggers={hiddenActionsOrTriggers}
                pieceMetadata={pieceMetadata}
                handleSelectOperationSuggestion={handleSelect}
              />
            </div>
          )}
      </div>
    );
  },
);

PieceCardListItem.displayName = 'PieceCardListItem';
