import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SidebarHeader } from '@/app/builder/sidebar-header';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import { UNSAVED_CHANGES_TOAST, toast } from '@/components/ui/use-toast';
import {
  PieceStepMetadata,
  StepMetadata,
  piecesHooks,
} from '@/features/pieces/lib/pieces-hook';
import { useElementSize } from '@/lib/utils';
import {
  Action,
  ActionType,
  FlowOperationType,
  Trigger,
  TriggerType,
  flowHelper,
  isNil,
} from '@activepieces/shared';

import { PieceCardInfo } from '../../../features/pieces/components/piece-selector-card';

import { pieceSelectorUtils } from './piece-selector-utils';

const PiecesSelectorList = () => {
  const [searchQuery, setSearchQuery] = useDebounce<string>('', 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const { height: containerHeight } = useElementSize(containerRef);
  const [
    exitPieceSelector,
    applyOperation,
    selectedButton,
    flowVersion,
    selectStepByName,
  ] = useBuilderStateContext((state) => [
    state.exitPieceSelector,
    state.applyOperation,
    state.selectedButton,
    state.flowVersion,
    state.selectStepByName,
  ]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  const { metadata, isLoading, refetch } = piecesHooks.useAllStepsMetadata({
    searchQuery,
    type: selectedButton!.type!,
    enabled: !isNil(selectedButton),
  });

  useEffect(() => {
    refetch();
  }, [selectedButton]);

  function getStepName(piece: StepMetadata) {
    if (piece.type === TriggerType.PIECE) {
      return 'trigger';
    }
    const baseName = 'step_';
    let number = 1;
    const steps = flowHelper.getAllSteps(flowVersion.trigger);
    while (steps.some((step) => step.name === `${baseName}${number}`)) {
      number++;
    }
    return `${baseName}${number}`;
  }

  function handleClick(piece: StepMetadata) {
    if (!selectedButton) {
      return;
    }
    const stepName = getStepName(piece);
    const defaultStep = pieceSelectorUtils.getDefaultStep(stepName, piece);
    if (piece.type === TriggerType.PIECE) {
      applyOperation(
        {
          type: FlowOperationType.UPDATE_TRIGGER,
          request: defaultStep as Trigger,
        },
        () => toast(UNSAVED_CHANGES_TOAST),
      );
    } else {
      applyOperation(
        {
          type: FlowOperationType.ADD_ACTION,
          request: {
            parentStep: selectedButton.stepname,
            stepLocationRelativeToParent: selectedButton.relativeLocation,
            action: defaultStep as Action,
          },
        },
        () => toast(UNSAVED_CHANGES_TOAST),
      );
    }
    selectStepByName(defaultStep.name);
  }

  function toKey(stepMetadata: StepMetadata): string {
    switch (stepMetadata.type) {
      case ActionType.PIECE:
      case TriggerType.PIECE: {
        const pieceMetadata: PieceStepMetadata =
          stepMetadata as PieceStepMetadata;
        return `${stepMetadata.type}-${pieceMetadata.pieceName}-${pieceMetadata.pieceVersion}`;
      }
      default:
        return stepMetadata.displayName.toLowerCase();
    }
  }

  return (
    <>
      <div ref={containerRef}>
        <SidebarHeader onClose={() => exitPieceSelector()}>
          {selectedButton?.type === 'action'
            ? t('Select Action')
            : t('Select Trigger')}
        </SidebarHeader>
        <div className="w-full  mb-4 px-4">
          <Input
            type="text"
            ref={searchInputRef}
            placeholder={t('Search for a piece')}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex h-full flex-col gap-4 px-4 pb-8">
        {isLoading && (
          <div className="flex h-full grow items-center justify-center text-center">
            <LoadingSpinner />
          </div>
        )}
        {metadata && metadata.length === 0 && (
          <div className="flex h-full grow items-center justify-center text-center">
            {t('No pieces found')}
          </div>
        )}
        {!isLoading && metadata && metadata.length > 0 && (
          <ScrollArea style={{ height: `calc(100% - ${containerHeight}px)` }}>
            <div className="flex h-max flex-col gap-4">
              {metadata &&
                metadata.map((stepMetadata) => (
                  <PieceCardInfo
                    piece={stepMetadata}
                    key={toKey(stepMetadata)}
                    interactive={true}
                    onClick={() => handleClick(stepMetadata)}
                  />
                ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
};

export { PiecesSelectorList };
