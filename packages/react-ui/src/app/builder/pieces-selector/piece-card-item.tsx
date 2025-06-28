import { useRef } from 'react';

import { CardListItem } from '@/components/custom/card-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/lib/types';
import { cn, wait } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

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
            hidePieceIconAndDescription={true}
            operation={operation}
          />
        </div>
      )}
    </>
  );
};

PieceCardListItem.displayName = 'PieceCardListItem';
export { PieceCardListItem };
