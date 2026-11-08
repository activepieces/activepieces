import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { useEffect } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';

import {
  StepReloadNotice,
  stepReloadHold,
  useStepReloadHold,
} from './step-reload-notice';
import {
  StepSettingsProvider,
  StepSettingsProviderProps,
} from './step-settings-context';

import { StepSettingsContainer } from '.';

export const StepSettingsPanel = ({
  pieceModel,
  pieceModelNotFound,
}: StepSettingsPanelProps) => {
  const [flowVersionId, draftRefreshCount, rightSidebar, selectedStep] =
    useBuilderStateContext((state) => [
      state.flowVersion.id,
      state.draftRefreshCount,
      state.rightSidebar,
      flowStructureUtil.getStep(
        state.selectedStep ?? '',
        state.flowVersion.trigger,
      ),
    ]);
  const held = useStepReloadHold((state) => state.held);
  const open = rightSidebar === RightSideBarType.PIECE_SETTINGS && selectedStep;
  const heldHere = open && held?.stepName === selectedStep.name ? held : null;
  useEffect(() => {
    if (held && !heldHere) stepReloadHold.release();
  }, [held, heldHere]);
  if (!open) {
    return null;
  }
  return (
    <div className="flex h-full flex-col">
      {heldHere && heldHere.draftRefreshCount !== draftRefreshCount && (
        <StepReloadNotice stepName={heldHere.stepName} />
      )}
      <div className="min-h-0 flex-1">
        <StepSettingsProvider
          pieceModel={pieceModel}
          pieceModelNotFound={pieceModelNotFound}
          selectedStep={selectedStep}
          key={constructContainerKey({
            flowVersionId,
            draftRefreshCount: heldHere?.draftRefreshCount ?? draftRefreshCount,
            step: selectedStep,
            hasPieceModelLoaded: !!pieceModel,
          })}
        >
          <StepSettingsContainer />
        </StepSettingsProvider>
      </div>
    </div>
  );
};

function constructContainerKey({
  flowVersionId,
  draftRefreshCount,
  step,
  hasPieceModelLoaded,
}: {
  flowVersionId: string;
  draftRefreshCount: number;
  step?: FlowAction | FlowTrigger;
  hasPieceModelLoaded: boolean;
}) {
  const stepName = step?.name;
  const triggerOrActionName =
    step?.type === FlowTriggerType.PIECE
      ? step?.settings.triggerName
      : step?.settings.actionName;
  const pieceName =
    step?.type === FlowTriggerType.PIECE || step?.type === FlowActionType.PIECE
      ? step?.settings.pieceName
      : undefined;
  const pieceVersion =
    step?.type === FlowTriggerType.PIECE || step?.type === FlowActionType.PIECE
      ? step?.settings.pieceVersion
      : undefined;
  const isSkipped =
    step?.type != FlowTriggerType.EMPTY &&
    step?.type != FlowTriggerType.PIECE &&
    step?.skip;
  return `${flowVersionId}-refresh-${draftRefreshCount}-${stepName ?? ''}-${
    triggerOrActionName ?? ''
  }-${pieceName ?? ''}-${pieceVersion ?? ''}-${'skipped-' + !!isSkipped}-${
    hasPieceModelLoaded ? 'loaded' : 'not-loaded'
  }`;
}

type StepSettingsPanelProps = Pick<
  StepSettingsProviderProps,
  'pieceModel' | 'pieceModelNotFound'
>;
