import { t } from 'i18next';
import { MoveLeft } from 'lucide-react';
import React, { useState } from 'react';

import {
  CardList,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/ui/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  StepMetadata,
  HandleSelectCallback,
  PieceStepMetadata,
} from '@/features/pieces/lib/types';
import { isNil } from '@activepieces/shared';

import { CreateTodoGuide } from './dialog-guides/create-todo-guide';

type StepsCardListProps = {
  selectedPieceMetadata: StepMetadata | undefined;
  handleSelect: HandleSelectCallback;
  hiddenActionsOrTriggers: string[];
};

export const StepsCardList: React.FC<StepsCardListProps> = ({
  hiddenActionsOrTriggers,
  selectedPieceMetadata,
  handleSelect,
}) => {
  const [openCreateTodoGuideDialog, setOpenCreateTodoGuideDialog] =
    useState(false);
  const { data: actionsOrTriggers, isLoading: isLoadingSelectedPieceMetadata } =
    piecesHooks.usePieceActionsOrTriggers({
      stepMetadata: selectedPieceMetadata,
    });

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
      {openCreateTodoGuideDialog &&
        selectedPieceMetadata &&
        actionsOrTriggers && (
          <CreateTodoGuide
            open={openCreateTodoGuideDialog}
            setOpen={setOpenCreateTodoGuideDialog}
            handleSelect={handleSelect}
            actionOrTriggers={actionsOrTriggers}
            selectedPieceMetadata={selectedPieceMetadata}
          />
        )}
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
              {actionsOrTriggers
                .filter((item) => !hiddenActionsOrTriggers.includes(item.name))
                .map((item) => (
                  <CardListItem
                    className="p-2 w-full"
                    key={item.displayName}
                    onClick={() => {
                      if (
                        (selectedPieceMetadata as PieceStepMetadata)
                          .pieceName === '@activepieces/piece-todos' &&
                        item.name === 'createTodo'
                      ) {
                        setOpenCreateTodoGuideDialog(true);
                      } else {
                        handleSelect(selectedPieceMetadata, item);
                      }
                    }}
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
