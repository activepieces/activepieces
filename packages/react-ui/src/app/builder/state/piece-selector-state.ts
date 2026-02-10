import { StoreApi } from 'zustand';

import { RightSideBarType, StepMetadataWithSuggestions } from '@/lib/types';
import { FlowTriggerType } from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';

export type PieceSelectorState = {
  openedPieceSelectorStepNameOrAddButtonId: string | null;
  setOpenedPieceSelectorStepNameOrAddButtonId: (
    stepNameOrAddButtonId: string | null,
  ) => void;
  selectedPieceMetadataInPieceSelector: StepMetadataWithSuggestions | null;
  setSelectedPieceMetadataInPieceSelector: (
    metadata: StepMetadataWithSuggestions | null,
  ) => void;
};

export const createPieceSelectorState = (
  _: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): PieceSelectorState => {
  return {
    openedPieceSelectorStepNameOrAddButtonId: null,
    setOpenedPieceSelectorStepNameOrAddButtonId: (
      stepNameOrAddButtonId: string | null,
    ) => {
      return set((state) => {
        const isReplacingEmptyTrigger =
          state.flowVersion.trigger.type === FlowTriggerType.EMPTY &&
          stepNameOrAddButtonId === 'trigger';
        return {
          openedPieceSelectorStepNameOrAddButtonId: stepNameOrAddButtonId,
          rightSidebar: isReplacingEmptyTrigger
            ? RightSideBarType.NONE
            : state.rightSidebar,
        };
      });
    },
    selectedPieceMetadataInPieceSelector: null,
    setSelectedPieceMetadataInPieceSelector: (
      metadata: StepMetadataWithSuggestions | null,
    ) => {
      return set(() => ({
        selectedPieceMetadataInPieceSelector: metadata,
      }));
    },
  };
};
