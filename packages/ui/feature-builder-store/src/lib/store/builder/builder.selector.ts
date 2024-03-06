import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GlobalBuilderState } from '../../model/global-builder-state.model';

import {
  FlowRunStatus,
  FlowRun,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
  flowHelper,
} from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';
import { FlowItemsDetailsState } from '../../model/flow-items-details-state.model';
import { ActionType, TriggerType } from '@activepieces/shared';
import { Step, StepWithIndex } from '../../model/step';
import { FlowStructureUtil } from '../../utils/flowStructureUtil';
import { BuilderSavingStatusEnum, CanvasState } from '../../model';
import { FlowItemDetails, MentionListItem } from '@activepieces/ui/common';
import { StepRunResult } from '../../utils/stepRunResult';
import {
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  CORE_SCHEDULE,
  corePieceIconUrl,
} from '@activepieces/ui/feature-pieces';

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

const selectCurrentStepSettings = createSelector(
  selectCurrentStep,
  (selectedStep) => {
    if (selectedStep && selectedStep) {
      return selectedStep.settings;
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
    return state.selectedRun;
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
    if (!run || run.status === FlowRunStatus.RUNNING) {
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

export const selectAllFlowItemsDetails = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    return state?.flowItemsDetailsState;
  }
);
export const selectAllFlowItemsDetailsLoadedState = createSelector(
  selectAllFlowItemsDetails,
  (state: FlowItemsDetailsState) => {
    return state.loaded;
  }
);

export const selectCoreFlowItemsDetails = createSelector(
  selectAllFlowItemsDetails,
  (state: FlowItemsDetailsState) => {
    return state.coreFlowItemsDetails;
  }
);
const selectMissingStepRecommendedFlowItemsDetails = createSelector(
  selectCoreFlowItemsDetails,
  (core: FlowItemDetails[]) => {
    const recommendations = core.filter(
      (f) =>
        (f.type === ActionType.PIECE &&
          f.extra?.pieceName === '@activepieces/piece-http') ||
        f.type === ActionType.CODE
    );
    return recommendations;
  }
);

export const selectFlowItemDetailsForCoreTriggers = createSelector(
  selectAllFlowItemsDetails,
  (state: FlowItemsDetailsState) => {
    return state.coreTriggerFlowItemsDetails.filter(
      (details) => details.type !== TriggerType.EMPTY
    );
  }
);
export const selectFlowItemDetailsForCustomPiecesActions = createSelector(
  selectAllFlowItemsDetails,
  (state: FlowItemsDetailsState) => {
    return state.customPiecesActionsFlowItemDetails;
  }
);
export const selectFlowItemDetailsForCustomPiecesTriggers = createSelector(
  selectAllFlowItemsDetails,
  (state: FlowItemsDetailsState) => {
    return state.customPiecesTriggersFlowItemDetails;
  }
);

export const selectFlowItemDetails = (flowItem: Step) =>
  createSelector(selectAllFlowItemsDetails, (state: FlowItemsDetailsState) => {
    if (flowItem.type === ActionType.PIECE) {
      if (
        CORE_PIECES_ACTIONS_NAMES.find((n) => n === flowItem.settings.pieceName)
      ) {
        return state.coreFlowItemsDetails.find(
          (c) => c.extra?.pieceName === flowItem.settings.pieceName
        );
      }
      return state.customPiecesActionsFlowItemDetails.find(
        (f) => f.extra?.pieceName === flowItem.settings.pieceName
      );
    }
    if (flowItem.type === TriggerType.PIECE) {
      if (CORE_PIECES_TRIGGERS.find((n) => n === flowItem.settings.pieceName)) {
        return state.coreTriggerFlowItemsDetails.find(
          (c) => c.extra?.pieceName === flowItem.settings.pieceName
        );
      }
      return state.customPiecesTriggersFlowItemDetails.find(
        (f) => f.extra?.pieceName === flowItem.settings.pieceName
      );
    }

    //Core items might contain remote flows so always have them at the end
    const coreItemDetials = state.coreFlowItemsDetails.find(
      (c) => c.type === flowItem.type
    );

    if (coreItemDetials) return coreItemDetials;
    const triggerItemDetails = state.coreTriggerFlowItemsDetails.find(
      (t) => t.type === flowItem.type
    );

    return triggerItemDetails;
  });

const selectAllStepsForMentionsDropdown = createSelector(
  selectCurrentStep,
  selectViewedVersion,
  selectAllFlowItemsDetails,
  (
    currentStep,
    flowVersion,
    flowItemDetails
  ): (MentionListItem & { step: StepWithIndex })[] => {
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
        logoUrl: findStepLogoUrlForMentions(s, flowItemDetails),
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
function findStepLogoUrlForMentions(
  step: Step,
  flowItemsDetailsState: FlowItemsDetailsState
) {
  switch (step.type) {
    case ActionType.PIECE:
      if (
        CORE_PIECES_ACTIONS_NAMES.find((n) => n === step.settings.pieceName)
      ) {
        return corePieceIconUrl(step.settings.pieceName);
      }
      return flowItemsDetailsState.customPiecesActionsFlowItemDetails.find(
        (i) => i.extra?.pieceName === step.settings.pieceName
      )?.logoUrl;
    case TriggerType.PIECE:
      if (CORE_PIECES_TRIGGERS.find((n) => n === step.settings.pieceName)) {
        return corePieceIconUrl(step.settings.pieceName);
      }
      return flowItemsDetailsState.customPiecesTriggersFlowItemDetails.find(
        (i) => i.extra?.pieceName === step.settings.pieceName
      )?.logoUrl;
    case TriggerType.EMPTY:
      return 'assets/img/custom/piece/emptyTrigger.png';
    case ActionType.BRANCH:
      return 'assets/img/custom/piece/branch_mention.png';
    case ActionType.LOOP_ON_ITEMS:
      return 'assets/img/custom/piece/loop_mention.png';
    case ActionType.CODE:
      return 'assets/img/custom/piece/code_mention.png';
  }
}

const selectIsSchduleTrigger = createSelector(selectCurrentFlow, (flow) => {
  if (flow?.version?.trigger.type === TriggerType.PIECE) {
    return flow.version.trigger.settings.pieceName === CORE_SCHEDULE;
  }
  return false;
});
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
const selectStepLogoUrl = (stepName: string) => {
  return createSelector(
    selectCurrentFlow,
    selectAllFlowItemsDetails,
    (flow, flowItemsDetails) => {
      const step = flowHelper
        .getAllSteps(flow?.version?.trigger)
        .find((s: Step) => s.name === stepName);
      if (!step) {
        throw new Error(`Couldn't find the step ${stepName}`);
      }
      const logoUrl = findStepLogoUrlForMentions(step, flowItemsDetails);
      return logoUrl;
    }
  );
};
const selectLastClickedAddBtnId = createSelector(selectCanvasState, (state) => {
  return state.clickedAddBtnId;
});

const selectFlowTriggerIsTested = createSelector(selectCurrentFlow, (flow) => {
  if (
    (flow.version.trigger.type === TriggerType.PIECE &&
      flow.version.trigger.settings.pieceName === CORE_SCHEDULE) ||
    flow.version.trigger.settings.pieceName === 'schedule'
  ) {
    return true;
  }
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
    if (publishedFlowVersion?.id === viewedFlowVersion.id) return 'PUBLISHED';
    if (draftVersionId === viewedFlowVersion.id) return 'DRAFT';
    return 'OLDER_VERSION';
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
  selectAllFlowItemsDetails,
  selectFlowItemDetails,
  selectAllFlowItemsDetailsLoadedState,
  selectCoreFlowItemsDetails,
  selectFlowItemDetailsForCoreTriggers,
  selectCurrentFlowValidity,
  selectFlowItemDetailsForCustomPiecesActions,
  selectFlowItemDetailsForCustomPiecesTriggers,
  selectAllStepsForMentionsDropdown,
  selectStepLogoUrl,
  selectCurrentStepSettings,
  selectTriggerSelectedSampleData,
  selectStepValidity,
  selectDraftVersionId,
  selectViewedVersion,
  selectIsSchduleTrigger,
  selectCurrentStepPieceVersionAndName,
  /**If string is empty will return the string equivalent of a space */
  selectStepTestSampleData,
  selectLastTestDate,
  selectNumberOfInvalidSteps,
  selectMissingStepRecommendedFlowItemsDetails,
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
};
