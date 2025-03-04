import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { MoveLeft } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { pieceSelectorUtils } from './piece-selector-utils';

import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/ui/card-list';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  StepMetadata,
  HandleSelectCallback,
} from '@/features/pieces/lib/types';

type StepsCardListProps = {
  selectedPieceMetadata: StepMetadata | undefined;
  handleSelect: HandleSelectCallback;
};

export const StepsCardList: React.FC<StepsCardListProps> = ({
  selectedPieceMetadata,
  handleSelect,
}) => {
  const { data: actionsOrTriggers, isLoading: isLoadingSelectedPieceMetadata } =
    piecesHooks.usePieceActionsOrTriggers({
      stepMetadata: selectedPieceMetadata,
    });
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setOpenCategory((prev) => (prev === category ? null : category));
  };

  const actionsOrTriggersGroups = useMemo(() => {
    return actionsOrTriggers
      ? pieceSelectorUtils.groupActionsByCategory(actionsOrTriggers)
      : undefined;
  }, [actionsOrTriggers]);

  if (
    (isNil(actionsOrTriggers) || !selectedPieceMetadata) &&
    !isLoadingSelectedPieceMetadata
  ) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-full w-full">
        <MoveLeft className="w-10 h-10 rtl:rotate-180" />
        <div className="text-sm">{t('Please select a piece first')}</div>
      </div>
    );
  }
  return (
    <ScrollArea className="h-full" viewPortClassName="h-full">
      <CardList
        className="w-[350px] min-w-[350px] h-full gap-0"
        listClassName="gap-0"
      >
        {isLoadingSelectedPieceMetadata && (
          <CardListItemSkeleton numberOfCards={5} withCircle={false} />
        )}

        {!isLoadingSelectedPieceMetadata &&
          selectedPieceMetadata &&
          actionsOrTriggers && (
            <>
              {actionsOrTriggersGroups?.categories
                ? actionsOrTriggersGroups.categories.map((category) => (
                    <Collapsible
                      key={category}
                      open={openCategory === category}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <CardListItem className="p-2">
                          <div className="flex gap-3 items-center w-full">
                            <PieceIcon
                              logoUrl={selectedPieceMetadata.logoUrl}
                              displayName={selectedPieceMetadata.displayName}
                              showTooltip={false}
                              size="sm"
                            />
                            <div className="text-sm">{category}</div>
                          </div>
                        </CardListItem>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {actionsOrTriggersGroups.grouped[category].map(
                          (item) => (
                            <CardListItem
                              key={item.displayName}
                              className="p-2 w-full"
                              onClick={() =>
                                handleSelect(selectedPieceMetadata, item)
                              }
                            >
                              <div className="flex gap-3 items-center">
                                <div className="flex flex-col gap-0.5 px-4">
                                  <div className="text-sm">
                                    {item.displayName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            </CardListItem>
                          ),
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                : actionsOrTriggers.map((item) => (
                    <CardListItem
                      key={item.displayName}
                      onClick={() => handleSelect(selectedPieceMetadata, item)}
                    >
                      <div className="flex gap-3 items-center">
                        <div>
                          <PieceIcon
                            logoUrl={selectedPieceMetadata.logoUrl}
                            displayName={selectedPieceMetadata.displayName}
                            showTooltip={false}
                            size={'sm'}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm">{item.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </CardListItem>
                  ))}
            </>
          )}
      </CardList>
    </ScrollArea>
  );
};
