import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GlobalBuilderState } from '../../model/global-builder-state.model';

import {
  FlowRun,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
  flowHelper,
  BranchActionSettings,
  CodeActionSettings,
  LoopOnItemsActionSettings,
  PieceActionSettings,
  PieceTriggerSettings,
  StepOutputStatus,
  FlowRunStatus,
} from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';
import { ActionType, TriggerType } from '@activepieces/shared';
import { Step, StepMetaDataForMentions } from '../../model/step';
import { FlowStructureUtil } from '../../utils/flowStructureUtil';
import { BuilderSavingStatusEnum, CanvasState } from '../../model';
import { StepRunResult } from '../../utils/stepRunResult';
import { VersionHisoricalStatus } from '@activepieces/ui/common';

export const BUILDER_STATE_NAME = 'builderState';

export const selectGlobalBuilderState =
  createFeatureSelector<GlobalBuilderState>(BUILDER_STATE_NAME);

const selectFlowState = createSelector(selectGlobalBuilderState, (state) => {
  return state.flowState;
});
const selectIsPublishing = createSelector(
  selectFlowState,
  (state) =>
    (state.savingStatus & BuilderSavingStatusEnum.PUBLISHING) ===
    BuilderSavingStatusEnum.PUBLISHING
);

const selectIsSaving = createSelector(
  selectFlowState,
  (state) =>
    (state.savingStatus & BuilderSavingStatusEnum.SAVING_FLOW) ===
      BuilderSavingStatusEnum.SAVING_FLOW ||
    (state.savingStatus & BuilderSavingStatusEnum.WAITING_TO_SAVE) ===
      BuilderSavingStatusEnum.WAITING_TO_SAVE
);
const selectCurrentFlow = createSelector(selectFlowState, (state) => {
  return state.flow;
});

const selectFlowHasAnySteps = createSelector(
  selectCurrentFlow,
  (flow) => !!flow.version.trigger?.nextAction
);

const selectViewMode = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => state.viewMode
);

const selectIsInDebugMode = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) =>
    state.viewMode === ViewModeEnum.VIEW_INSTANCE_RUN
);

const selectIsInPublishedVersionViewMode = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => state.viewMode === ViewModeEnum.SHOW_PUBLISHED
);
const selectShowIncompleteStepsWidget = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => state.viewMode === ViewModeEnum.BUILDING
);

const selectReadOnly = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => state.viewMode !== ViewModeEnum.BUILDING
);

const selectCanvasState = createSelector(selectGlobalBuilderState, (state) => {
  return state.canvasState;
});

const selectHasFlowBeenPublished = createSelector(
  selectCurrentFlow,
  (flow: PopulatedFlow) => {
    return flow.publishedVersionId !== null;
  }
);

const selectFlowStatus = createSelector(
  selectCurrentFlow,
  (flow: PopulatedFlow) => {
    return flow.status;
  }
);
const selectViewedVersion = createSelector(selectCanvasState, (canvasState) => {
  return canvasState.viewedVersion;
});
const selectIsCurrentVersionPublished = createSelector(
  selectCurrentFlow,
  (flow) => {
    return flow.version.state === FlowVersionState.LOCKED;
  }
);

export const selectCurrentFlowValidity = createSelector(
  selectCurrentFlow,
  (flow: PopulatedFlow | undefined) => {
    if (!flow) return false;
    return flow.version?.valid || false;
  }
);

export const selectCurrentStepName = createSelector(
  selectCanvasState,
  (canvasState) => {
    return canvasState.selectedStepName;
  }
);

export const selectCurrentStep = createSelector(selectCanvasState, (state) => {
  const step: Step | undefined = flowHelper.getStep(
    state.viewedVersion,
    state.selectedStepName
  );
  return step;
});

const selectCurrentPieceStepTriggerOrActionName = createSelector(
  selectCurrentStep,
  (step) => {
    const triggerOrActionName =
      step?.type === ActionType.PIECE
        ? step.settings.actionName
        : step?.type === TriggerType.PIECE
        ? step.settings.triggerName
        : undefined;
    return {
      triggerOrActionname: triggerOrActionName,
      stepName: step?.name,
    };
  }
);
/**Declared this function so compiler size limit doesn't get exceeded */
const extractStepSettings: (step: Step) =>
  | {
      type: ActionType.BRANCH;
      settings: BranchActionSettings;
    }
  | {
      type: ActionType.CODE;
      settings: CodeActionSettings;
    }
  | {
      type: ActionType.LOOP_ON_ITEMS;
      settings: LoopOnItemsActionSettings;
    }
  | {
      type: ActionType.PIECE;
      settings: PieceActionSettings;
    }
  | {
      type: TriggerType.PIECE;
      settings: PieceTriggerSettings;
    }
  | {
      type: TriggerType.EMPTY;
      settings: Record<string, unknown>;
    } = (step: Step) => {
  switch (step.type) {
    case ActionType.PIECE: {
      return {
        type: step.type,
        settings: step.settings,
      };
    }
    case TriggerType.PIECE: {
      return {
        type: step.type,
        settings: step.settings,
      };
    }
    case ActionType.CODE: {
      return {
        type: step.type,
        settings: step.settings,
      };
    }
    case ActionType.BRANCH: {
      return {
        type: step.type,
        settings: step.settings,
      };
    }
    case ActionType.LOOP_ON_ITEMS: {
      return {
        type: step.type,
        settings: step.settings,
      };
    }
    case TriggerType.EMPTY: {
      return {
        type: step.type,
        settings: step.settings,
      };
    }
  }
};
const selectCurrentStepSettings = createSelector(
  selectCurrentStep,
  (selectedStep) => {
    if (selectedStep) {
      return extractStepSettings(selectedStep);
    }
    return undefined;
  }
);
const selectTriggerSelectedSampleData = createSelector(
  selectCurrentStep,
  (step) => {
    if (step && step.type === TriggerType.PIECE && step.settings.inputUiInfo) {
      return step.settings.inputUiInfo.currentSelectedData;
    }
    return undefined;
  }
);
/**If string is empty will return the string equivalent of a space */
const selectStepTestSampleData = createSelector(selectCurrentStep, (step) => {
  if (
    step &&
    (step.type === ActionType.PIECE ||
      step.type === ActionType.CODE ||
      step.type === ActionType.BRANCH ||
      step.type === TriggerType.PIECE ||
      step.type === ActionType.LOOP_ON_ITEMS) &&
    step.settings.inputUiInfo
  ) {
    if (step.settings.inputUiInfo.currentSelectedData === '') {
      return ' ';
    }
    return step.settings.inputUiInfo.currentSelectedData;
  }
  return undefined;
});
const selectStepTestSampleDataStringified = createSelector(
  selectStepTestSampleData,
  (res) => {
    return res ? res : res === undefined ? 'undefined' : JSON.stringify(res);
  }
);
const selectLastTestDate = createSelector(selectCurrentStep, (step) => {
  if (
    step &&
    (step.type === ActionType.PIECE ||
      step.type === ActionType.CODE ||
      step.type === ActionType.BRANCH ||
      step.type === ActionType.LOOP_ON_ITEMS) &&
    step.settings.inputUiInfo
  ) {
    return step.settings.inputUiInfo.lastTestDate;
  }
  return undefined;
});

export const selectCurrentStepDisplayName = createSelector(
  selectCurrentStep,
  (step: { displayName: string } | undefined) => {
    return step?.displayName || '';
  }
);
export const selectDraftVersion = createSelector(selectCurrentFlow, (flow) => {
  return flow.version;
});
export const selectDraftVersionId = createSelector(
  selectDraftVersion,
  (draftVersion: FlowVersion) => {
    return draftVersion.id;
  }
);
export const selectNumberOfInvalidSteps = createSelector(
  selectCurrentFlow,
  (flow) => {
    const steps = flowHelper.getAllSteps(flow.version.trigger);
    return steps.reduce((prev, curr) => prev + (curr.valid ? 0 : 1), 0);
  }
);
export const selectCurrentFlowRun = createSelector(
  selectCanvasState,
  (state) => {
    return state.runInfo.selectedRun;
  }
);

const selectPublishedFlowVersion = createSelector(selectCurrentFlow, (flow) => {
  return flow.publishedFlowVersion;
});

export const selectCurrentFlowRunStatus = createSelector(
  selectCurrentFlowRun,
  (run: FlowRun | undefined) => {
    if (run === undefined) {
      return undefined;
    }
    return run.status;
  }
);
const selectStepDisplayNameAndDfsIndexForIterationOutput = (
  iteration: Pick<StepRunResult, 'stepName' | 'output'>[]
) => {
  return createSelector(selectCurrentFlow, (flow) => {
    const steps = flowHelper.getAllSteps(flow.version.trigger);
    const results: StepRunResult[] = [];
    steps.forEach((s) => {
      const iterationStep = iteration.find((its) => its.stepName === s.name);
      const stepIndex = FlowStructureUtil.findStepIndex(
        flow.version.trigger,
        s.name
      );
      if (iterationStep) {
        results.push({
          output: iterationStep.output,
          stepName: s.name,
          displayName: s.displayName,
          index: stepIndex,
        });
      }
    });
    return results;
  });
};
const selectStepResultsAccordion = createSelector(
  selectCurrentFlow,
  selectCurrentFlowRun,
  (flow, run) => {
    if (!run || !run.steps) {
      return [];
    }
    const steps = flowHelper.getAllSteps(flow.version.trigger);
    const results: StepRunResult[] = [];
    steps.forEach((s) => {
      const stepIndex = FlowStructureUtil.findStepIndex(
        flow.version.trigger,
        s.name
      );
      if (run.steps[s.name]) {
        results.push({
          output: run.steps[s.name],
          stepName: s.name,
          displayName: s.displayName,
          index: stepIndex,
        });
      }
    });
    return results;
  }
);
export const selectCurrentLeftSidebarType = createSelector(
  selectCanvasState,
  (state: CanvasState) => {
    return state.leftSidebar.type;
  }
);

export const selectCurrentRightSideBar = createSelector(
  selectCanvasState,
  (state: CanvasState) => {
    return state.rightSidebar;
  }
);

export const selectCurrentRightSideBarType = createSelector(
  selectCanvasState,
  (state: CanvasState) => {
    return state.rightSidebar.type;
  }
);

const selectAllStepsForMentionsDropdown = createSelector(
  selectCurrentStep,
  selectViewedVersion,
  (currentStep, flowVersion): StepMetaDataForMentions[] => {
    if (!currentStep || !flowVersion || !flowVersion.trigger) {
      return [];
    }
    const path = FlowStructureUtil.findPathToStep(
      currentStep,
      flowVersion?.trigger
    );
    return path.map((s) => {
      return {
        label: s.displayName,
        value: `{{${s.name}}}`,
        step: s,
      };
    });
  }
);

const selectStepIndex = (stepName: string) => {
  return createSelector(selectViewedVersion, (version) => {
    return FlowStructureUtil.findStepIndex(version.trigger, stepName);
  });
};
const selectStepValidity = createSelector(selectCurrentStep, (step) => {
  return step?.valid || false;
});
const selectCurrentLoopIndexes = createSelector(selectCanvasState, (state) => {
  return state.runInfo.loopIndexes;
});

const selectStepOutput = (stepName: string) => {
  return createSelector(
    selectCurrentFlowRun,
    selectCurrentLoopIndexes,
    selectViewedVersion,
    (run, loopIndexes, viewedVersion) => {
      if (!run || !run.steps) {
        return undefined;
      }
      return FlowStructureUtil.extractStepOutput(
        stepName,
        loopIndexes,
        run.steps,
        viewedVersion.trigger
      );
    }
  );
};
const selectStepOutputStatus = (stepName: string) => {
  return createSelector(
    selectCurrentFlowRun,
    selectCurrentLoopIndexes,
    selectViewedVersion,
    (run, loopIndexes, viewedVersion) => {
      if (!run) {
        return undefined;
      }
      if (run && run.status === FlowRunStatus.RUNNING && !run.steps) {
        return StepOutputStatus.RUNNING;
      }
      const stepStatus = FlowStructureUtil.extractStepOutput(
        stepName,
        loopIndexes,
        run.steps,
        viewedVersion.trigger
      )?.status;
      if (stepStatus) {
        return stepStatus;
      }

      const parents = FlowStructureUtil.findStepParents(
        stepName,
        viewedVersion.trigger
      );
      if (
        parents === undefined ||
        ((parents.length === 0 ||
          run.steps[parents[0].name]?.status !== StepOutputStatus.SUCCEEDED) &&
          (run.status === FlowRunStatus.PAUSED ||
            run.status === FlowRunStatus.RUNNING))
      ) {
        return StepOutputStatus.RUNNING;
      }

      return undefined;
    }
  );
};

const selectCurrentStepOutput = createSelector(
  selectCurrentStepName,
  selectCurrentFlowRun,
  selectCurrentLoopIndexes,
  selectViewedVersion,
  (stepName, run, loopIndexes, viewedVersion) => {
    if (!run || !run.steps) {
      return undefined;
    }
    return FlowStructureUtil.extractStepOutput(
      stepName,
      loopIndexes,
      run.steps,
      viewedVersion.trigger
    );
  }
);

const selectLoopIndex = (stepName: string) => {
  return createSelector(selectCurrentLoopIndexes, (loopIndexes) => {
    return loopIndexes[stepName];
  });
};

const selectCurrentStepPieceVersionAndName = createSelector(
  selectCurrentStep,
  (s) => {
    if (s?.type === TriggerType.PIECE || s?.type === ActionType.PIECE) {
      return {
        version: s.settings.pieceVersion,
        pieceName: s.settings.pieceName,
      };
    }
    return undefined;
  }
);

const selectLastClickedAddBtnId = createSelector(selectCanvasState, (state) => {
  return state.clickedAddBtnId;
});

const selectFlowTriggerIsTested = createSelector(selectCurrentFlow, (flow) => {
  switch (flow.version.trigger.type) {
    case TriggerType.EMPTY:
      return false;
    case TriggerType.PIECE:
      return !!flow.version.trigger.settings.inputUiInfo.currentSelectedData;
  }
});

const selectViewedVersionHistoricalStatus = createSelector(
  selectDraftVersionId,
  selectPublishedFlowVersion,
  selectViewedVersion,
  (draftVersionId, publishedFlowVersion, viewedFlowVersion) => {
    if (publishedFlowVersion?.id === viewedFlowVersion.id)
      return VersionHisoricalStatus.PUBLISHED;
    if (draftVersionId === viewedFlowVersion.id)
      return VersionHisoricalStatus.DRAFT;
    return VersionHisoricalStatus.OLDER_VERSION;
  }
);

export const BuilderSelectors = {
  selectReadOnly,
  selectViewMode,
  selectIsInPublishedVersionViewMode,
  selectCurrentFlowRun,
  selectCurrentFlow,
  selectCurrentRightSideBar,
  selectCurrentStep,
  selectIsPublishing,
  selectIsSaving,
  selectFlowHasAnySteps,
  selectCurrentLeftSidebarType,
  selectCurrentStepName,
  selectCurrentRightSideBarType,
  selectCurrentFlowRunStatus,
  selectCurrentStepDisplayName,
  selectIsInDebugMode,
  selectCurrentFlowValidity,
  selectAllStepsForMentionsDropdown,
  selectCurrentStepSettings,
  selectTriggerSelectedSampleData,
  selectStepValidity,
  selectDraftVersionId,
  selectViewedVersion,
  selectCurrentStepPieceVersionAndName,
  /**If string is empty will return the string equivalent of a space */
  selectStepTestSampleData,
  selectLastTestDate,
  selectNumberOfInvalidSteps,
  selectStepTestSampleDataStringified,
  selectIsCurrentVersionPublished,
  selectPublishedFlowVersion,
  selectHasFlowBeenPublished,
  selectStepResultsAccordion,
  selectStepDisplayNameAndDfsIndexForIterationOutput,
  selectLastClickedAddBtnId,
  selectFlowTriggerIsTested,
  selectStepIndex,
  selectFlowStatus,
  selectViewedVersionHistoricalStatus,
  selectDraftVersion,
  selectShowIncompleteStepsWidget,
  selectCurrentPieceStepTriggerOrActionName,
  selectCurrentStepOutput,
  selectStepOutput,
  selectStepOutputStatus,
  selectLoopIndex,
};
