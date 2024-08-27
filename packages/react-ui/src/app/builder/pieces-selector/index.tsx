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
  StepLocationRelativeToParent,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

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

  const [selectedMetadata, setSelectedMetadata] = useState<
    StepMetadata | undefined
  >(undefined);
  const [selectedSubItems, setSelectedSubItems] = useState<
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

  const { metadata, isLoading: isLoadingPiecesList } =
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

  const handleSelect = (piece: StepMetadata | undefined) => {
    if (!piece) {
      return;
    }
    resetField();
    onOpenChange(false);

    const stepName = pieceSelectorUtils.getStepName(piece, flowVersion);
    const defaultStep = pieceSelectorUtils.getDefaultStep(stepName, piece);

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

  const { mutate, isPending: isLoadingPieceMetadata } = useMutation({
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
              displayName: stepMetadata.description,
              description: '',
            },
          ];
        case ActionType.BRANCH:
          return [
            {
              name: 'branch',
              displayName: t('Branch on Condition'),
              description: '',
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
              {isLoadingPiecesList && (
                <CardListItemSkeleton numberOfCards={5} withCircle={false} />
              )}
              {!isLoadingPiecesList &&
                piecesMetadata &&
                piecesMetadata.map((stepMetadata) => (
                  <CardListItem
                    className="p-3"
                    key={pieceSelectorUtils.toKey(stepMetadata)}
                    onClick={(e) => {
                      setSelectedMetadata(stepMetadata);
                      mutate(stepMetadata);
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <div>
                      <img
                        src={stepMetadata.logoUrl}
                        alt={stepMetadata.displayName}
                        className="size-[24px] object-contain"
                      />
                    </div>
                    <div className="flex-grow h-full flex items-center justify-left text-sm">
                      {stepMetadata.displayName}
                    </div>
                  </CardListItem>
                ))}
            </ScrollArea>
          </CardList>
          <Separator orientation="vertical" className="h-full" />
          <ScrollArea>
            <CardList className="w-[350px] min-w-[350px]">
              {!isLoadingPiecesList && (
                <>
                  {isLoadingPieceMetadata && (
                    <CardListItemSkeleton
                      numberOfCards={5}
                      withCircle={false}
                    />
                  )}
                  {!isLoadingPieceMetadata &&
                    selectedSubItems &&
                    selectedSubItems.map((item) => (
                      <CardListItem
                        className="p-2 w-full"
                        key={item.name}
                        onClick={() => handleSelect(selectedMetadata)}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm">{item.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </CardListItem>
                    ))}
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
