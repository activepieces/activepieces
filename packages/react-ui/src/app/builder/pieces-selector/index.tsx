import React, { useState, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import {
  PieceTagEnum,
  PieceTagGroup,
} from '@/app/builder/pieces-selector/piece-tag-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { UNSAVED_CHANGES_TOAST, toast } from '@/components/ui/use-toast';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  StepMetadata,
  PieceSelectorOperation,
  HandleSelectCallback,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  Action,
  ActionType,
  FlowOperationType,
  flowStructureUtil,
  isNil,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { SearchInput } from '../../../components/ui/search-input';

import { PiecesCardList } from './pieces-card-list';
import { StepsCardList } from './steps-card-list';

type PieceSelectorProps = {
  children: React.ReactNode;
  open: boolean;
  asChild?: boolean;
  initialSelectedPiece?: string | undefined;
  onOpenChange: (open: boolean) => void;
} & { operation: PieceSelectorOperation };

type PieceGroup = {
  title: string;
  pieces: StepMetadataWithSuggestions[];
};

const PieceSelector = ({
  children,
  open,
  asChild = true,
  onOpenChange,
  operation,
  initialSelectedPiece,
}: PieceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedPieceMetadata, setSelectedMetadata] = useState<
    StepMetadata | undefined
  >(undefined);

  const initiallySelectedMetaDataRef = useRef<StepMetadata | undefined>(
    undefined,
  );

  const [selectedTag, setSelectedTag] = useState<PieceTagEnum>(
    PieceTagEnum.ALL,
  );
  const [applyOperation, selectStepByName, flowVersion, setSampleData] =
    useBuilderStateContext((state) => [
      state.applyOperation,
      state.selectStepByName,
      state.flowVersion,
      state.setSampleData,
    ]);

  const isTrigger = operation.type === FlowOperationType.UPDATE_TRIGGER;
  const { metadata, isLoading: isLoadingPieces } =
    piecesHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: isTrigger ? 'trigger' : 'action',
    });

  const { platform } = platformHooks.useCurrentPlatform();

  const pieceGroups = useMemo(() => {
    if (!metadata) return [];

    const filteredMetadataOnTag = metadata.filter((stepMetadata) => {
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
    });

    const piecesMetadata =
      debouncedQuery.length > 0
        ? filterOutPiecesWithNoSuggestions(filteredMetadataOnTag)
        : filteredMetadataOnTag;

    const sortedPiecesMetadata = piecesMetadata.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );

    initiallySelectedMetaDataRef.current = sortedPiecesMetadata.find(
      (p) => p.displayName === initialSelectedPiece,
    );
    setSelectedMetadata(initiallySelectedMetaDataRef.current);

    if (debouncedQuery.length > 0 && sortedPiecesMetadata.length > 0) {
      return [{ title: 'Search Results', pieces: sortedPiecesMetadata }];
    }

    const flowControllerPieces = sortedPiecesMetadata.filter(
      (p) => pieceSelectorUtils.isFlowController(p) && !isTrigger,
    );
    const universalAiPieces = sortedPiecesMetadata.filter(
      (p) => pieceSelectorUtils.isUniversalAiPiece(p) && !isTrigger,
    );
    const utilityCorePieces = sortedPiecesMetadata.filter(
      (p) => pieceSelectorUtils.isUtilityCorePiece(p, platform) && !isTrigger,
    );
    const popularPieces = sortedPiecesMetadata.filter(
      (p) =>
        pieceSelectorUtils.isPopularPieces(p, platform) &&
        selectedTag !== PieceTagEnum.AI,
    );
    const other = sortedPiecesMetadata.filter(
      (p) =>
        !popularPieces.includes(p) &&
        !utilityCorePieces.includes(p) &&
        !flowControllerPieces.includes(p) &&
        !universalAiPieces.includes(p),
    );

    const groups: PieceGroup[] = [
      { title: 'Popular', pieces: popularPieces },
      { title: 'Flow Control', pieces: flowControllerPieces },
      { title: 'Utility', pieces: utilityCorePieces },
      { title: 'Universal AI', pieces: universalAiPieces },
      { title: 'Other', pieces: other },
    ];

    return groups.filter((group) => group.pieces.length > 0);
  }, [
    metadata,
    selectedTag,
    debouncedQuery,
    platform,
    isTrigger,
    initialSelectedPiece,
  ]);

  const piecesIsLoaded = !isLoadingPieces && pieceGroups.length > 0;
  const noResultsFound = !isLoadingPieces && pieceGroups.length === 0;

  const {
    listHeightRef,
    popoverTriggerRef,
    aboveListSectionHeight,
    maxListHeight,
  } = pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace(open);

  const resetField = () => {
    setSearchQuery('');
    setSelectedMetadata(initiallySelectedMetaDataRef.current);
    setSelectedTag(PieceTagEnum.ALL);
  };

  const handleSelect: HandleSelectCallback = (
    stepMetadata,
    actionOrTrigger,
  ) => {
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
        setSampleData(stepData.name, undefined);
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
              ...operation.actionLocation,
              action: stepData as Action,
            },
          },
          () => toast(UNSAVED_CHANGES_TOAST),
        );
        selectStepByName(stepData.name);
        break;
      }
      case FlowOperationType.UPDATE_ACTION: {
        const currentAction = flowStructureUtil.getStep(
          operation.stepName,
          flowVersion.trigger,
        );
        if (isNil(currentAction)) {
          console.error(
            "Trying to update an action that's not in the displayed flow version",
          );
          return;
        }
        if (
          currentAction.type === TriggerType.EMPTY ||
          currentAction.type === TriggerType.PIECE
        ) {
          console.error(
            "Trying to update an action that's actually the trigger in the displayed flow version",
          );
          return;
        }
        if (
          (currentAction.type !== ActionType.PIECE &&
            stepData.type !== ActionType.PIECE &&
            stepData.type === currentAction.type) ||
          (currentAction.type === ActionType.PIECE &&
            stepData.type === ActionType.PIECE &&
            stepData.settings.actionName === currentAction.settings.actionName)
        ) {
          return;
        }

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

  return (
    <Popover
      open={open}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          resetField();
          listHeightRef.current = maxListHeight;
        }
        onOpenChange(open);
      }}
    >
      <PopoverTrigger ref={popoverTriggerRef} asChild={asChild}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] md:w-[600px] p-0 shadow-lg"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <>
          <div
            style={{
              height: `${aboveListSectionHeight}px`,
            }}
          >
            <div className="p-2">
              <SearchInput
                placeholder="Search"
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
          </div>

          {(window.innerWidth || document.documentElement.clientWidth) >=
            768 && (
            <div
              className=" flex   flex-row overflow-y-auto max-h-[300px] h-[300px] "
              style={{
                height: listHeightRef.current + 'px',
              }}
            >
              <PiecesCardList
                debouncedQuery={debouncedQuery}
                selectedTag={selectedTag}
                piecesIsLoaded={piecesIsLoaded}
                noResultsFound={noResultsFound}
                selectedPieceMetadata={selectedPieceMetadata}
                setSelectedMetadata={setSelectedMetadata}
                operation={operation}
                handleSelect={handleSelect}
                pieceGroups={pieceGroups}
                isLoadingPieces={isLoadingPieces}
              />

              {debouncedQuery.length === 0 &&
                piecesIsLoaded &&
                !noResultsFound && (
                  <>
                    <Separator orientation="vertical" className="h-full" />
                    <StepsCardList
                      selectedPieceMetadata={selectedPieceMetadata}
                      handleSelect={handleSelect}
                    />
                  </>
                )}
            </div>
          )}

          {(window.innerWidth || document.documentElement.clientWidth) <
            768 && (
            <div
              className=" max-h-[300px] h-[300px]"
              style={{
                height: listHeightRef.current + 'px',
              }}
            >
              <PiecesCardList
                debouncedQuery={debouncedQuery}
                selectedTag={selectedTag}
                piecesIsLoaded={piecesIsLoaded}
                noResultsFound={noResultsFound}
                selectedPieceMetadata={selectedPieceMetadata}
                setSelectedMetadata={setSelectedMetadata}
                operation={operation}
                handleSelect={handleSelect}
                pieceGroups={pieceGroups}
                isLoadingPieces={isLoadingPieces}
              />
            </div>
          )}
        </>
      </PopoverContent>
    </Popover>
  );
};

export { PieceSelector };

function filterOutPiecesWithNoSuggestions(
  metadata: StepMetadataWithSuggestions[],
) {
  return metadata.filter((step) => {
    const isActionWithSuggestions =
      step.type === ActionType.PIECE &&
      step.suggestedActions &&
      step.suggestedActions.length > 0;
    const isTriggerWithSuggestions =
      step.type === TriggerType.PIECE &&
      step.suggestedTriggers &&
      step.suggestedTriggers.length > 0;
    const isNotPieceType =
      step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE;

    return (
      isActionWithSuggestions || isTriggerWithSuggestions || isNotPieceType
    );
  });
}
