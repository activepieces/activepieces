import { t } from 'i18next';
import { MoveLeft, SearchX } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/seperator';
import { UNSAVED_CHANGES_TOAST, toast } from '@/components/ui/use-toast';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  StepMetadata,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
  HandleSelectCallback,
} from '@/features/pieces/lib/types';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  Action,
  ActionType,
  ApFlagId,
  FlowOperationType,
  isNil,
  supportUrl,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { SearchInput } from '../../../components/ui/search-input';
import { cn } from '../../../lib/utils';

import { PieceSearchSuggestions } from './piece-search-suggestions';

const filterOutPiecesWithNoSuggestions = (
  metadata: StepMetadataWithSuggestions[],
) => {
  return metadata.filter(
    (step) =>
      (step.type === ActionType.PIECE &&
        step.suggestedActions &&
        step.suggestedActions.length > 0) ||
      (step.type === TriggerType.PIECE &&
        step.suggestedTriggers &&
        step.suggestedTriggers.length > 0) ||
      (step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE),
  );
};

type PieceSelectorProps = {
  children: React.ReactNode;
  open: boolean;
  asChild?: boolean;
  onOpenChange: (open: boolean) => void;
} & { operation: PieceSelectorOperation };

const PieceSelector = ({
  children,
  open,
  asChild = true,
  onOpenChange,
  operation,
}: PieceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const { data: showRequestPieceButton } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const [selectedPieceMetadata, setSelectedMetadata] = useState<
    StepMetadata | undefined
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
    setSelectedMetadata(undefined);
    setSelectedTag(PieceTagEnum.ALL);
  };

  const handleSelect: HandleSelectCallback = (
    stepMetadata,
    actionOrTrigger,
  ) => {
    if (!stepMetadata) {
      return;
    }
    resetField();
    onOpenChange(false);
    const newStepName = pieceSelectorUtils.getStepName(
      stepMetadata,
      flowVersion,
    );

    const stepData = pieceSelectorUtils.getDefaultStep({
      stepName: newStepName,
      stepMetadata,
      actionOrTrigger,
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

  const { data: actionsOrTriggers, isLoading: isLoadingSelectedPieceMetadata } =
    piecesHooks.usePieceActionsOrTriggers({
      stepMetadata: selectedPieceMetadata,
    });

  const piecesMetadata = useMemo(() => {
    const filteredMetadataOnTag = metadata
      ? metadata.filter((stepMetadata) => {
          switch (selectedTag) {
            case PieceTagEnum.CORE:
              return pieceSelectorUtils.isCorePiece(stepMetadata);
            case PieceTagEnum.AI:
              return pieceSelectorUtils.isAiPiece(stepMetadata);
            case PieceTagEnum.APPS:
              return pieceSelectorUtils.isAppPiece(stepMetadata);
            case PieceTagEnum.ALL:
            default:
              return true;
          }
        })
      : [];
    return debouncedQuery.length > 0
      ? filterOutPiecesWithNoSuggestions(filteredMetadataOnTag)
      : filteredMetadataOnTag;
  }, [metadata, selectedTag]);

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
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className="p-2">
          <SearchInput
            placeholder={t('Search')}
            value={searchQuery}
            showDeselect={searchQuery.length > 0}
            onChange={(e) => {
              setSearchQuery(e);
              setSelectedTag(PieceTagEnum.ALL);
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
            setSelectedMetadata(undefined);
          }}
        />
        <Separator orientation="horizontal" />
        <div className="flex overflow-y-auto max-h-[300px] h-[300px]">
          {isLoadingPieces && (
            <div className="flex flex-col gap-2">
              <CardListItemSkeleton numberOfCards={2} withCircle={false} />
            </div>
          )}

          {!isLoadingPieces && piecesMetadata && (
            <CardList
              className={cn('w-[250px] min-w-[250px] transition-all ', {
                'w-full': debouncedQuery.length > 0,
              })}
              listClassName="gap-0"
            >
              {piecesMetadata.map((pieceMetadata) => (
                <div key={pieceSelectorUtils.toKey(pieceMetadata)}>
                  <CardListItem
                    className="flex-col p-3 gap-1 items-start"
                    selected={
                      pieceMetadata.displayName ===
                        selectedPieceMetadata?.displayName &&
                      debouncedQuery.length === 0
                    }
                    interactive={debouncedQuery.length === 0}
                    onMouseEnter={() => {
                      setSelectedMetadata(pieceMetadata);
                    }}
                  >
                    <div className="flex gap-2 items-center">
                      <PieceIcon
                        logoUrl={pieceMetadata.logoUrl}
                        displayName={pieceMetadata.displayName}
                        showTooltip={false}
                        size={'sm'}
                      ></PieceIcon>
                      <div className="flex-grow h-full flex items-center justify-left text-sm">
                        {pieceMetadata.displayName}
                      </div>
                    </div>
                  </CardListItem>

                  {debouncedQuery.length > 0 &&
                    pieceMetadata.type !== TriggerType.EMPTY && (
                      <div
                        onMouseEnter={() => {
                          setSelectedMetadata(pieceMetadata);
                        }}
                      >
                        <PieceSearchSuggestions
                          pieceMetadata={pieceMetadata}
                          handleSelectOperationSuggestion={handleSelect}
                        />
                      </div>
                    )}
                </div>
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
            </CardList>
          )}

          {debouncedQuery.length === 0 && (
            <>
              <Separator orientation="vertical" className="h-full" />
              <ScrollArea className="h-full">
                <CardList
                  className="w-[350px] min-w-[350px] h-full gap-0"
                  listClassName="gap-0"
                >
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
                            key={item.displayName}
                            onClick={() =>
                              handleSelect(selectedPieceMetadata, item)
                            }
                          >
                            <div className="flex gap-3 items-center">
                              <div>
                                <PieceIcon
                                  logoUrl={selectedPieceMetadata.logoUrl}
                                  displayName={
                                    selectedPieceMetadata.displayName
                                  }
                                  showTooltip={false}
                                  size={'sm'}
                                ></PieceIcon>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="text-sm">
                                  {item.displayName}
                                </div>
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
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };
