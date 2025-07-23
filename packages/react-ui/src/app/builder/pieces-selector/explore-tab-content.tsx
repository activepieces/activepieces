import {
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/lib/piece-selector-tabs-provider';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { PieceSelectorOperation } from '@/lib/types';
import { FlowOperationType } from '@activepieces/shared';

import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

const ExploreTabContent = ({
  operation,
}: {
  operation: PieceSelectorOperation;
}) => {
  const { selectedTab, selectedPieceInExplore, setSelectedPieceInExplore } =
    usePieceSelectorTabs();
  const { data: categories, isLoading: isLoadingPieces } =
    piecesHooks.usePiecesSearch({
      searchQuery: '',
      type:
        operation.type === FlowOperationType.UPDATE_TRIGGER
          ? 'trigger'
          : 'action',
    });
  if (selectedTab !== PieceSelectorTabType.EXPLORE) {
    return null;
  }
  if (isLoadingPieces) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <CardListItemSkeleton numberOfCards={2} withCircle={false} />
      </div>
    );
  }

  if (selectedPieceInExplore) {
    return (
      <div className="w-full">
        <PieceActionsOrTriggersList
          stepMetadataWithSuggestions={selectedPieceInExplore}
          hidePieceIconAndDescription={false}
          operation={operation}
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex  p-2  ">
        {categories.map((category) => (
          <div key={category.title} className="flex w-[50%] flex-col gap-0.5 ">
            <div className="text-sm text-muted-foreground mb-1.5">
              {category.title}
            </div>

            {category.metadata.map((pieceMetadata) => (
              <CardListItem
                className="rounded-sm py-3"
                key={pieceMetadata.displayName}
                onClick={() => setSelectedPieceInExplore(pieceMetadata)}
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
                </div>{' '}
              </CardListItem>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export { ExploreTabContent };
