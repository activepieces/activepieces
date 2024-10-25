import React, { useState, useMemo } from 'react';
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
import { Separator } from '@/components/ui/seperator';
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
}: PieceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const [selectedPieceMetadata, setSelectedMetadata] = useState<
    StepMetadata | undefined
  >(undefined);

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
  }, [metadata, selectedTag, debouncedQuery, platform, isTrigger]);

  const piecesIsLoaded = !isLoadingPieces && pieceGroups.length > 0;
  const noResultsFound = !isLoadingPieces && pieceGroups.length === 0;

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
        <div className="flex overflow-y-auto max-h-[320px] h-[320px]">
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
          {debouncedQuery.length === 0 && piecesIsLoaded && !noResultsFound && (
            <>
              <Separator orientation="vertical" className="h-full" />
              <StepsCardList
                selectedPieceMetadata={selectedPieceMetadata}
                handleSelect={handleSelect}
              />
            </>
          )}
        </div>
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
