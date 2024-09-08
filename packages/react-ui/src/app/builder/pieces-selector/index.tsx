import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { MoveLeft, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import {
  PieceTagEnum,
  PieceTagGroup,
} from '@/app/builder/pieces-selector/piece-tag-group';
import { Button } from '@/components/ui/button';
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
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import {
  PieceStepMetadata,
  StepMetadata,
  piecesHooks,
} from '@/features/pieces/lib/pieces-hook';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  Action,
  ActionType,
  ApFlagId,
  FlowOperationType,
  isNil,
  StepLocationRelativeToParent,
  supportUrl,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

type ItemListMetadata = {
  name: string;
  displayName: string;
  description: string;
};

type PieceSelectorProps = {
  children: React.ReactNode;
  operation:
    | {
        type: FlowOperationType.ADD_ACTION;
        actionLocation: {
          parentStep: string;
          stepLocationRelativeToParent: StepLocationRelativeToParent;
        };
      }
    | { type: FlowOperationType.UPDATE_TRIGGER }
    | {
        type: FlowOperationType.UPDATE_ACTION;
        stepName: string;
      };
  open: boolean;
  asChild?: boolean;
  onOpenChange: (open: boolean) => void;
};

const PieceSelector = ({
  children,
  open,
  asChild = true,
  onOpenChange,
  operation,
}: PieceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const showRequestPieceButton = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  ).data;
  const [selectedPieceMetadata, setSelectedMetadata] = useState<
    StepMetadata | undefined
  >(undefined);
  const [actionsOrTriggers, setSelectedSubItems] = useState<
    ItemListMetadata[] | undefined
  >(undefined);

  const [selectedTag, setSelectedTag] = useState<PieceTagEnum>(
    PieceTagEnum.ALL,
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
      type:
        operation.type === FlowOperationType.UPDATE_TRIGGER
          ? 'trigger'
          : 'action',
    });

  const resetField = () => {
    setSearchQuery('');
    setSelectedSubItems(undefined);
    setSelectedMetadata(undefined);
    setSelectedTag(PieceTagEnum.ALL);
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
    const newStepName = pieceSelectorUtils.getStepName(piece, flowVersion);
    const stepData = pieceSelectorUtils.getDefaultStep({
      stepName: newStepName,
      piece,
      actionOrTriggerName: item.name,
      displayName: item.displayName,
    });

    switch (operation.type) {
      case FlowOperationType.UPDATE_TRIGGER: {
        applyOperation(
          {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: stepData as Trigger,
          },
          () => toast(UNSAVED_CHANGES_TOAST),
        );
        selectStepByName('trigger');
        break;
      }
      case FlowOperationType.ADD_ACTION: {
        applyOperation(
          {
            type: FlowOperationType.ADD_ACTION,
            request: {
              parentStep: operation.actionLocation.parentStep,
              stepLocationRelativeToParent:
                operation.actionLocation.stepLocationRelativeToParent,
              action: stepData as Action,
            },
          },
          () => toast(UNSAVED_CHANGES_TOAST),
        );
        selectStepByName(stepData.name);
        break;
      }
      case FlowOperationType.UPDATE_ACTION: {
        applyOperation(
          {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
              type: (stepData as Action).type,
              displayName: stepData.displayName,
              name: operation.stepName,
              settings: {
                ...stepData.settings,
              },
              valid: stepData.valid,
            },
          },
          () => toast(UNSAVED_CHANGES_TOAST),
        );
      }
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
            operation.type === FlowOperationType.UPDATE_TRIGGER
              ? pieceMetadata.triggers
              : pieceMetadata.actions,
          ).map(([actionOrTriggerName, actionOrTrigger]) => ({
            name: actionOrTriggerName,
            displayName: actionOrTrigger.displayName,
            description: actionOrTrigger.description,
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
                'Split your flow into branches depending on condition(s)',
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
        switch (selectedTag) {
          case PieceTagEnum.CORE:
            return pieceSelectorUtils.isCorePiece(stepMetadata);
          case PieceTagEnum.AI:
            return pieceSelectorUtils.isAiPiece(stepMetadata);
          case PieceTagEnum.APPS:
            return pieceSelectorUtils.isAppPiece(stepMetadata);
          case PieceTagEnum.ALL:
            return true;
        }
      }),
    [metadata, selectedTag],
  );

  return (
    <Popover
      open={open}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          resetField();
        }
        onOpenChange(open);
      }}
    >
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[600px] p-0 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2">
          <Input
            className="border-none"
            placeholder={t('Search')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTag(PieceTagEnum.ALL);
              setSelectedSubItems(undefined);
              setSelectedMetadata(undefined);
            }}
          />
        </div>
        <PieceTagGroup
          selectedTag={selectedTag}
          type={
            operation.type === FlowOperationType.UPDATE_TRIGGER
              ? 'trigger'
              : 'action'
          }
          onSelectTag={(value) => {
            setSelectedTag(value);
            setSelectedSubItems(undefined);
            setSelectedMetadata(undefined);
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
                    selected={
                      pieceMetadata.displayName ===
                      selectedPieceMetadata?.displayName
                    }
                    onClick={(e) => {
                      if (
                        pieceMetadata.displayName !==
                        selectedPieceMetadata?.displayName
                      ) {
                        setSelectedMetadata(pieceMetadata);
                        mutate(pieceMetadata);
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                  >
                    <div>
                      <PieceIcon
                        logoUrl={pieceMetadata.logoUrl}
                        displayName={pieceMetadata.displayName}
                        showTooltip={false}
                        size={'sm'}
                      ></PieceIcon>
                    </div>
                    <div className="flex-grow h-full flex items-center justify-left text-sm">
                      {pieceMetadata.displayName}
                    </div>
                  </CardListItem>
                ))}

              {!isLoadingPieces &&
                (!piecesMetadata || piecesMetadata.length === 0) && (
                  <div className="flex flex-col gap-2 items-center justify-center h-[300px] ">
                    <SearchX className="w-10 h-10" />
                    <div className="text-sm ">{t('No pieces found')}</div>
                    <div className="text-sm ">
                      {t('Try adjusting your search')}
                    </div>
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
                    selectedPieceMetadata &&
                    actionsOrTriggers &&
                    actionsOrTriggers.map((item) => (
                      <CardListItem
                        className="p-2 w-full"
                        key={item.name}
                        onClick={() =>
                          handleSelect(selectedPieceMetadata, item)
                        }
                      >
                        <div className="flex gap-3 items-center">
                          <div>
                            <PieceIcon
                              logoUrl={selectedPieceMetadata.logoUrl}
                              displayName={selectedPieceMetadata.displayName}
                              showTooltip={false}
                              size={'sm'}
                            ></PieceIcon>
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
              {(isNil(actionsOrTriggers) || isLoadingPieces) && (
                <div className="flex flex-col gap-2 items-center justify-center h-[300px]">
                  <MoveLeft className="w-10 h-10 rtl:rotate-180" />
                  <div className="text-sm">
                    {t('Please select a piece first')}
                  </div>
                </div>
              )}
            </CardList>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };
