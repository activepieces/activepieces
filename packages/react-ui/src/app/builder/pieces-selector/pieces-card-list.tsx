import { t } from 'i18next';
import { SearchX } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import { Button } from '@/components/ui/button';
import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/ui/card-list';
import { Separator } from '@/components/ui/separator';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import {
  StepMetadata,
  PieceSelectorOperation,
  HandleSelectCallback,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, TriggerType, supportUrl } from '@activepieces/shared';

import { cn } from '../../../lib/utils';

import { PieceSearchSuggestions } from './piece-search-suggestions';
import { PieceTagEnum } from './piece-tag-group';

type PieceGroup = {
  title: string;
  pieces: StepMetadataWithSuggestions[];
};

type PiecesCardListProps = {
  debouncedQuery: string;
  selectedTag: PieceTagEnum;
  selectedPieceMetadata: StepMetadata | undefined;
  setSelectedMetadata: (metadata: StepMetadata) => void;
  operation: PieceSelectorOperation;
  handleSelect: HandleSelectCallback;
  pieceGroups: PieceGroup[];
  isLoadingPieces: boolean;
  piecesIsLoaded: boolean;
  noResultsFound: boolean;
};

export const PiecesCardList: React.FC<PiecesCardListProps> = ({
  debouncedQuery,
  selectedPieceMetadata,
  setSelectedMetadata,
  handleSelect,
  pieceGroups,
  isLoadingPieces,
  piecesIsLoaded,
  noResultsFound,
}) => {
  const { data: showRequestPieceButton } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );

  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (piecesIsLoaded && selectedItemRef.current) {
      selectedItemRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
      });
    }
  }, [piecesIsLoaded, selectedPieceMetadata]);

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

      {piecesIsLoaded &&
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

            {group.pieces.map((pieceMetadata) => (
              <PieceCardListItem
                key={pieceSelectorUtils.toKey(pieceMetadata)}
                pieceMetadata={pieceMetadata}
                selectedPieceMetadata={selectedPieceMetadata}
                debouncedQuery={debouncedQuery}
                setSelectedMetadata={setSelectedMetadata}
                handleSelect={handleSelect}
                ref={
                  pieceMetadata.displayName ===
                  selectedPieceMetadata?.displayName
                    ? selectedItemRef
                    : null
                }
              />
            ))}
          </React.Fragment>
        ))}

      {noResultsFound && (
        <div className="flex flex-col gap-2 items-center justify-center h-full ">
          <SearchX className="w-10 h-10" />
          <div className="text-sm ">{t('No pieces found')}</div>
          <div className="text-sm ">{t('Try adjusting your search')}</div>
          {showRequestPieceButton && (
            <Link
              to={`${supportUrl}/c/feature-requests/9`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="h-8 px-2 ">Request Piece</Button>
            </Link>
          )}
        </div>
      )}
    </CardList>
  );
};

const PieceCardListItem = React.forwardRef<
  HTMLDivElement,
  {
    pieceMetadata: StepMetadataWithSuggestions;
    selectedPieceMetadata: StepMetadata | undefined;
    debouncedQuery: string;
    setSelectedMetadata: (metadata: StepMetadata) => void;
    handleSelect: HandleSelectCallback;
  }
>(
  (
    {
      pieceMetadata,
      selectedPieceMetadata,
      debouncedQuery,
      setSelectedMetadata,
      handleSelect,
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

        {(debouncedQuery.length > 0 ||
          (window.innerWidth || document.documentElement.clientWidth) < 768) &&
          pieceMetadata.type !== TriggerType.EMPTY && (
            <div onMouseEnter={(e) => handleMouseEnter(e.currentTarget)}>
              <PieceSearchSuggestions
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
