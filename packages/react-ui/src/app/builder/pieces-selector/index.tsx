import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import {
  PieceTagEnum,
  PieceTagGroup,
} from '@/app/builder/pieces-selector/piece-tag-group';
import {
  CardList,
  CardListItemSkeleton,
  CardListItem,
} from '@/components/ui/card-list';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/seperator';
import {
  INTERNAL_ERROR_TOAST,
  UNSAVED_CHANGES_TOAST,
  toast,
} from '@/components/ui/use-toast';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import {
  PieceStepMetadata,
  StepMetadata,
  piecesHooks,
} from '@/features/pieces/lib/pieces-hook';
import {
  Action,
  ActionType,
  FlowOperationType,
  isNil,
  StepLocationRelativeToParent,
  Trigger,
  TriggerType,
} from '@activepieces/shared';
import { MoveLeft } from 'lucide-react';

type ItemListMetadata = {
  name: string;
  displayName: string;
  description: string;
};

type PieceSelectorsProps = {
  children: React.ReactNode;
  type: 'action' | 'trigger';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLocation?: {
    parentStep: string;
    stepLocationRelativeToParent: StepLocationRelativeToParent;
  };
};

const PieceSelectors = ({
  children,
  type,
  open,
  onOpenChange,
  actionLocation,
}: PieceSelectorsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const [selectedPieceMetadata, setSelectedMetadata] = useState<
    StepMetadata | undefined
  >(undefined);
  const [actionsOrTriggers, setSelectedSubItems] = useState<
    ItemListMetadata[] | undefined
  >(undefined);

  const [selectedTag, setSelectedTag] = useState<undefined | PieceTagEnum>(
    undefined,
  );
  const [applyOperation, selectStepByName, flowVersion] =
    useBuilderStateContext((state) => [
      state.applyOperation,
      state.selectStepByName,
      state.flowVersion,
    ]);

  const { metadata, isLoading: isLoadingPieces } =
    piecesHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type,
    });

  const resetField = () => {
    setSearchQuery('');
    setSelectedSubItems(undefined);
    setSelectedMetadata(undefined);
    setSelectedTag(undefined);
  };

  const handleSelect = (
    piece: StepMetadata | undefined,
    item: ItemListMetadata,
  ) => {
    if (!piece) {
      return;
    }
    resetField();
    onOpenChange(false);
    const stepName = pieceSelectorUtils.getStepName(piece, flowVersion);
    const defaultStep = pieceSelectorUtils.getDefaultStep(
      stepName,
      piece,
      item.name,
    );

    if (piece.type === TriggerType.PIECE) {
      applyOperation(
        {
          type: FlowOperationType.UPDATE_TRIGGER,
          request: defaultStep as Trigger,
        },
        () => toast(UNSAVED_CHANGES_TOAST),
      );
    } else if (actionLocation) {
      applyOperation(
        {
          type: FlowOperationType.ADD_ACTION,
          request: {
            parentStep: actionLocation.parentStep,
            stepLocationRelativeToParent:
              actionLocation.stepLocationRelativeToParent,
            action: defaultStep as Action,
          },
        },
        () => toast(UNSAVED_CHANGES_TOAST),
      );
      selectStepByName(defaultStep.name);
    }
  };

  const { mutate, isPending: isLoadingSelectedPieceMetadata } = useMutation({
    mutationFn: async (stepMetadata: StepMetadata) => {
      switch (stepMetadata.type) {
        case TriggerType.PIECE:
        case ActionType.PIECE: {
          const pieceMetadata = await piecesApi.get({
            name: (stepMetadata as PieceStepMetadata).pieceName,
          });
          return Object.entries(
            type === 'action' ? pieceMetadata.actions : pieceMetadata.triggers,
          ).map(([actionName, action]) => ({
            name: actionName,
            displayName: action.displayName,
            description: action.description,
          }));
        }
        case ActionType.CODE:
          return [
            {
              name: 'code',
              displayName: t('Custom Javascript Code'),
              description: stepMetadata.description,
            },
          ];
        case ActionType.LOOP_ON_ITEMS:
          return [
            {
              name: 'loop',
              displayName: t('Loop on Items'),
              description: stepMetadata.description,
            },
          ];
        case ActionType.BRANCH:
          return [
            {
              name: 'branch',
              displayName: t('Branch'),
              description: t(
                'Split your flow into branches depedning on condition(s)',
              ),
            },
          ];
        case TriggerType.EMPTY:
          throw new Error('Unsupported type: ' + stepMetadata.type);
      }
    },
    onSuccess: (items) => {
      setSelectedSubItems(items);
    },
    onError: (e) => {
      console.error(e);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const piecesMetadata = useMemo(
    () =>
      metadata?.filter((stepMetadata) => {
        if (!selectedTag) return true;
        switch (selectedTag) {
          case PieceTagEnum.CORE:
            return pieceSelectorUtils.isCorePiece(stepMetadata);
          case PieceTagEnum.AI:
            return pieceSelectorUtils.isAiPiece(stepMetadata);
          case PieceTagEnum.APPS:
            return pieceSelectorUtils.isAppPiece(stepMetadata);
        }
      }),
    [metadata, selectedTag],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          resetField();
        }
        onOpenChange(open);
      }}
      modal={false}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[600px] p-0">
        <div className="p-2">
          <Input
            className="border-none"
            placeholder={t('Search')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTag(undefined);
              setSelectedSubItems(undefined);
            }}
          />
        </div>
        <PieceTagGroup
          selectedTag={selectedTag}
          type={type}
          onSelectTag={(value) => {
            setSelectedTag(value);
            setSelectedSubItems(undefined);
          }}
        />
        <Separator orientation="horizontal" />
        <div className="flex overflow-y-auto max-h-[300px] h-[300px]">
          <CardList className="w-[250px] min-w-[250px]">
            <ScrollArea>
              {isLoadingPieces && (
                <CardListItemSkeleton numberOfCards={5} withCircle={false} />
              )}
              {!isLoadingPieces &&
                piecesMetadata &&
                piecesMetadata.map((pieceMetadata) => (
                  <CardListItem
                    className="p-3"
                    key={pieceSelectorUtils.toKey(pieceMetadata)}
                    onClick={(e) => {
                      setSelectedMetadata(pieceMetadata);
                      mutate(pieceMetadata);
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <div>
                      <img
                        src={pieceMetadata.logoUrl}
                        alt={pieceMetadata.displayName}
                        className="size-[24px] object-contain"
                      />
                    </div>
                    <div className="flex-grow h-full flex items-center justify-left text-sm">
                      {pieceMetadata.displayName}
                    </div>
                  </CardListItem>
                ))}
            </ScrollArea>
          </CardList>
          <Separator orientation="vertical" className="h-full" />
          <ScrollArea className="h-full">
            <CardList className="w-[350px] min-w-[350px] h-full">
              {!isLoadingPieces && (
                <>
                  {isLoadingSelectedPieceMetadata && (
                    <CardListItemSkeleton
                      numberOfCards={5}
                      withCircle={false}
                    />
                  )}
                  {!isLoadingSelectedPieceMetadata &&
                    actionsOrTriggers &&
                    actionsOrTriggers.map((item) => (
                      <CardListItem
                        className="p-2 w-full"
                        key={item.name}
                        onClick={() =>
                          handleSelect(selectedPieceMetadata, item)
                        }
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm">{item.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </CardListItem>
                    ))}

                  {isNil(actionsOrTriggers) &&
                    !isLoadingSelectedPieceMetadata && (
                      <div className="flex flex-col gap-2 items-center justify-center h-[300px]">
                        <MoveLeft className="w-10 h-10 rtl:rotate-180" />
                        <div className="text-sm">
                          {t('Please select a piece first')}
                        </div>
                      </div>
                    )}
                </>
              )}
            </CardList>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelectors };
