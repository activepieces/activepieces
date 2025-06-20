import { t } from 'i18next';
import { SearchX, WandSparkles } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import {
  StepMetadata,
  PieceSelectorOperation,
  HandleSelectCallback,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ApFlagId,
  FlowOperationType,
  TriggerType,
  supportUrl,
} from '@activepieces/shared';

import { cn } from '../../../lib/utils';

import { AskAiButton } from './ask-ai';
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
  closePieceSelector: () => void;
  hiddenActionsOrTriggers: string[];
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
  operation,
  closePieceSelector,
  hiddenActionsOrTriggers,
}) => {
  const { data: showCommunityLinks } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const isEmbedding = useEmbedding().embedState.isEmbedded;
  const showRequestPieceButton = showCommunityLinks && !isEmbedding;
  const selectedItemRef = useRef<HTMLDivElement | null>(null);
  const isCopilotEnabled = platformHooks.isCopilotEnabled();
  useEffect(() => {
    if (
      piecesIsLoaded &&
      selectedItemRef.current &&
      debouncedQuery.length === 0
    ) {
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
                hiddenActionsOrTriggers={hiddenActionsOrTriggers}
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

      {noResultsFound &&
        isCopilotEnabled &&
        operation.type !== FlowOperationType.UPDATE_TRIGGER && (
          <div className="flex flex-col gap-2 items-center justify-center h-full ">
            <WandSparkles className="w-14 h-14" />
            <div className="text-sm mb-3">
              {t('Let our AI assistant help you out')}
            </div>
            <AskAiButton
              varitant={'default'}
              operation={operation}
              onClick={closePieceSelector}
            ></AskAiButton>
            {showRequestPieceButton && (
              <>
                {t('Or')}
                <Link
                  to={`${supportUrl}/c/feature-requests/9`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    {t('Request Piece')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}

      {noResultsFound &&
        (!isCopilotEnabled ||
          operation.type === FlowOperationType.UPDATE_TRIGGER) && (
          <div className="flex flex-col gap-2 items-center justify-center h-full ">
            <SearchX className="w-14 h-14" />
            <div className="text-sm ">{t('No pieces found')}</div>
            <div className="text-sm ">{t('Try adjusting your search')}</div>
            {showRequestPieceButton && (
              <Link
                to={`${supportUrl}/c/feature-requests/9`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="h-8 px-2 ">{t('Request Piece')}</Button>
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
