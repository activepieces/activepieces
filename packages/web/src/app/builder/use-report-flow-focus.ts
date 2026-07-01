import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import type { Step } from '@activepieces/shared';
import { useEffect, useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';
import {
  useStageOptional,
  StageFocus,
} from '@/app/components/workspace-shell/stage-context';

// Publishes the builder's selected step up to the Stage so the chat knows
// exactly where the user is inside the open flow ("this step", "why is it
// failing"). Cleared on unmount; the Stage also clears focus when it closes.
export function useReportFlowFocus() {
  const stage = useStageOptional();
  const reportStageFocus = stage?.reportStageFocus;

  // Select only value-stable values: a string KEY for the multi-selection (box-drag
  // / shift-click populate selectedNodes) and the trigger ref. Resolving the names
  // to steps inside the selector would return a fresh array every call, which —
  // destructured as a `focus` dependency — recomputes `focus` on every render and
  // turns the reportStageFocus effect into an infinite update loop.
  const [
    flowId,
    selectedStepName,
    selectedStep,
    selectedNodesKey,
    trigger,
    isEditingStep,
  ] = useBuilderStateContext((state) => [
    state.flowVersion.flowId,
    state.selectedStep,
    flowStructureUtil.getStep(
      state.selectedStep ?? '',
      state.flowVersion.trigger,
    ),
    state.selectedNodes.join(','),
    state.flowVersion.trigger,
    state.rightSidebar === RightSideBarType.PIECE_SETTINGS &&
      !isNil(state.selectedStep),
  ]);

  const focus = useMemo<StageFocus | null>(() => {
    const nodeNames = selectedNodesKey ? selectedNodesKey.split(',') : [];
    if (nodeNames.length > 1) {
      const steps = nodeNames
        .map((name) => flowStructureUtil.getStep(name, trigger))
        .filter((step): step is Step => !isNil(step));
      if (steps.length > 1) {
        const names = steps.map((step) => step.displayName);
        const shown = names.slice(0, MULTI_STEP_PREVIEW);
        const summary =
          shown.join(', ') +
          (names.length > shown.length
            ? `, +${names.length - shown.length} more`
            : '');
        return {
          scopeType: 'flow',
          scopeId: flowId,
          kind: 'flow-steps',
          label: `${names.length} steps selected (${summary})`,
          ref: steps.map((step) => step.name).join(','),
        };
      }
    }
    if (isNil(selectedStepName) || isNil(selectedStep)) {
      return null;
    }
    return {
      scopeType: 'flow',
      scopeId: flowId,
      kind: 'flow-step',
      label: selectedStep.displayName,
      ref: selectedStep.name,
      detail: stepDetail(selectedStep, isEditingStep),
    };
  }, [
    flowId,
    selectedStepName,
    selectedStep,
    selectedNodesKey,
    trigger,
    isEditingStep,
  ]);

  useEffect(() => {
    reportStageFocus?.(focus);
  }, [reportStageFocus, focus]);

  useEffect(() => {
    return () => reportStageFocus?.(null);
  }, [reportStageFocus]);
}

const MULTI_STEP_PREVIEW = 4;

function pieceShortName(pieceName: string): string {
  return pieceName.replace('@activepieces/piece-', '');
}

function stepDetail(step: Step, editing: boolean): string {
  const base = stepTypeLabel(step);
  return editing ? `${base} · settings open` : base;
}

function stepTypeLabel(step: Step): string {
  switch (step.type) {
    case FlowTriggerType.PIECE:
      return `trigger · ${pieceShortName(step.settings.pieceName)}`;
    case FlowTriggerType.EMPTY:
      return 'trigger';
    case FlowActionType.PIECE:
      return `action · ${pieceShortName(step.settings.pieceName)}`;
    case FlowActionType.LOOP_ON_ITEMS:
      return 'loop';
    case FlowActionType.ROUTER:
      return 'router';
    case FlowActionType.CODE:
      return 'code';
    default:
      return 'step';
  }
}
