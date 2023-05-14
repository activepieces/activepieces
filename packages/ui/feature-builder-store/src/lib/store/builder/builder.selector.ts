import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GlobalBuilderState } from '../../model/global-builder-state.model';

import { AppConnection, Flow, FlowRun, flowHelper } from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';

import { FlowItemsDetailsState } from '../../model/flow-items-details-state.model';
import { ActionType, TriggerType } from '@activepieces/shared';
import { FlowItem } from '../../model/flow-item';
import { MentionListItem } from '../../model/mention-list-item';
import { FlowStructureUtil } from '../../utils/flowStructureUtil';
import { ConnectionDropdownItem } from '../../model/connections-dropdown-item';
import { BuilderSavingStatusEnum, BuilderState } from '../../model';
import {
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  FlowItemDetails,
  corePieceIconUrl,
} from '@activepieces/ui/common';

export const BUILDER_STATE_NAME = 'builderState';

export const selectGlobalBuilderState =
  createFeatureSelector<GlobalBuilderState>(BUILDER_STATE_NAME);

export const selectIsPublishing = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) =>
    (state.flowState.savingStatus & BuilderSavingStatusEnum.PUBLISHING) ===
    BuilderSavingStatusEnum.PUBLISHING
);

export const selectIsSaving = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) =>
    (state.flowState.savingStatus & BuilderSavingStatusEnum.SAVING_FLOW) ===
    BuilderSavingStatusEnum.SAVING_FLOW
);

export const selectFlowHasAnySteps = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) =>
    !!state.flowState.flow.version.trigger?.nextAction
);

export const selectViewMode = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => state.viewMode
);

export const selectIsInDebugMode = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) =>
    state.viewMode === ViewModeEnum.VIEW_INSTANCE_RUN
);

export const selectReadOnly = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => state.viewMode !== ViewModeEnum.BUILDING
);

export const selectCurrentInstance = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    return state.instance;
  }
);

export const selectCurrentFlow = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.flow;
  }
);
export const selectCurrentFlowFolderName = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    if (!state.flowState.folder) {
      return 'Uncategorized';
    }
    return state.flowState.folder.displayName;
  }
);

export const selectCurrentFlowValidity = createSelector(
  selectCurrentFlow,
  (flow: Flow | undefined) => {
    if (!flow) return false;
    return flow.version?.valid || false;
  }
);

export const selectCurrentStep = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.builderState.focusedStep;
  }
);

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
    if (
      step &&
      (step.type === TriggerType.PIECE || step.type === TriggerType.WEBHOOK) &&
      step.settings.inputUiInfo
    ) {
      return step.settings.inputUiInfo.currentSelectedData;
    }
    return undefined;
  }
);
const selectStepTestSampleData = createSelector(selectCurrentStep, (step) => {
  if (
    step &&
    (step.type === ActionType.PIECE || step.type === ActionType.CODE) &&
    step.settings.inputUiInfo
  ) {
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
    (step.type === ActionType.PIECE || step.type === ActionType.CODE) &&
    step.settings.inputUiInfo
  ) {
    return step.settings.inputUiInfo.lastTestDate;
  }
  return undefined;
});
export const selectCurrentStepName = createSelector(
  selectCurrentStep,
  (selectedStep) => {
    if (selectedStep) {
      return selectedStep.name;
    }
    return '';
  }
);
export const selectCurrentStepDisplayName = createSelector(
  selectCurrentStep,
  (step) => {
    return step?.displayName || '';
  }
);

export const selectCurrentFlowVersionId = createSelector(
  selectCurrentFlow,
  (flow: Flow | undefined) => {
    if (!flow) return undefined;
    return flow.version?.id;
  }
);
export const selectNumberOfInvalidSteps = createSelector(
  selectCurrentFlow,
  (flow) => {
    const steps = flowHelper.getAllSteps(flow.version);
    return steps.reduce((prev, curr) => prev + (curr.valid ? 0 : 1), 0);
  }
);
export const selectCurrentFlowRun = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.builderState.selectedRun;
  }
);

export const selectCurrentFlowRunStatus = createSelector(
  selectCurrentFlowRun,
  (run: FlowRun | undefined) => {
    if (run === undefined) {
      return undefined;
    }
    return run.status;
  }
);
const selectBuidlerState = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.builderState;
  }
);
export const selectCurrentLeftSidebarType = createSelector(
  selectBuidlerState,
  (state: BuilderState) => {
    return state.leftSidebar.type;
  }
);
export const selectIsGeneratingFlowComponentOpen = createSelector(
  selectBuidlerState,
  (state: BuilderState) => {
    return state.isGeneratingFlowComponentOpen;
  }
);

export const selectCurrentRightSideBar = createSelector(
  selectBuidlerState,
  (state: BuilderState) => {
    return state.rightSidebar;
  }
);

export const selectCurrentRightSideBarType = createSelector(
  selectBuidlerState,
  (state: BuilderState) => {
    return state.rightSidebar.type;
  }
);

export const selectAllFlowItemsDetails = createSelector(
  selectGlobalBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowItemsDetailsState;
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
        (f.type === ActionType.PIECE && f.extra?.appName === 'http') ||
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

export const selectFlowItemDetails = (flowItem: FlowItem) =>
  createSelector(selectAllFlowItemsDetails, (state: FlowItemsDetailsState) => {
    if (flowItem.type === ActionType.PIECE) {
      if (
        CORE_PIECES_ACTIONS_NAMES.find((n) => n === flowItem.settings.pieceName)
      ) {
        return state.coreFlowItemsDetails.find(
          (c) => c.extra?.appName === flowItem.settings.pieceName
        );
      }
      return state.customPiecesActionsFlowItemDetails.find(
        (f) => f.extra?.appName === flowItem.settings.pieceName
      );
    }
    if (flowItem.type === TriggerType.PIECE) {
      if (CORE_PIECES_TRIGGERS.find((n) => n === flowItem.settings.pieceName)) {
        return state.coreTriggerFlowItemsDetails.find(
          (c) => c.extra?.appName === flowItem.settings.pieceName
        );
      }
      return state.customPiecesTriggersFlowItemDetails.find(
        (f) => f.extra?.appName === flowItem.settings.pieceName
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

const selectAllAppConnections = createSelector(
  selectGlobalBuilderState,
  (globalState) => globalState.appConnectionsState.connections
);

export const selectConnection = (connectionName: string) =>
  createSelector(selectAllAppConnections, (connections: AppConnection[]) => {
    return connections.find((c) => c.name === connectionName);
  });

const selectAppConnectionsDropdownOptions = createSelector(
  selectAllAppConnections,
  (connections: AppConnection[]) => {
    return [...connections].map((c) => {
      const result: ConnectionDropdownItem = {
        label: { appName: c.appName, name: c.name },
        value: `\${connections.${c.name}}`,
      };
      return result;
    });
  }
);

const selectAllFlowSteps = createSelector(
  selectCurrentFlow,
  (flow: Flow | undefined) => {
    if (flow && flow.version) {
      return FlowStructureUtil.traverseAllSteps(flow.version.trigger, false);
    }
    return [];
  }
);

const selectAppConnectionsForMentionsDropdown = createSelector(
  selectAllAppConnections,
  (connections: AppConnection[]) => {
    return [...connections].map((c) => {
      const result: MentionListItem = {
        label: c.name,
        value: `\${connections.${c.name}}`,
      };
      return result;
    });
  }
);

const selectAllStepsForMentionsDropdown = createSelector(
  selectCurrentStep,
  selectCurrentFlow,
  selectAllFlowItemsDetails,
  (
    currentStep,
    flow,
    flowItemDetails
  ): (MentionListItem & { step: FlowItem })[] => {
    if (!currentStep || !flow || !flow.version || !flow.version.trigger) {
      return [];
    }
    const path = FlowStructureUtil.findPathToStep(
      currentStep,
      flow?.version?.trigger
    );
    return path.map((s) => {
      return {
        label: s.displayName,
        value: `\${${s.name}}`,
        step: s,
        logoUrl: findStepLogoUrlForMentions(s, flowItemDetails),
      };
    });
  }
);
const selectStepValidity = createSelector(selectCurrentStep, (step) => {
  return step?.valid || false;
});
function findStepLogoUrlForMentions(
  step: FlowItem,
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
        (i) => i.extra?.appName === step.settings.pieceName
      )?.logoUrl;
    case TriggerType.PIECE:
      if (CORE_PIECES_TRIGGERS.find((n) => n === step.settings.pieceName)) {
        return corePieceIconUrl(step.settings.pieceName);
      }
      return flowItemsDetailsState.customPiecesTriggersFlowItemDetails.find(
        (i) => i.extra?.appName === step.settings.pieceName
      )?.logoUrl;
    case TriggerType.EMPTY:
      return 'assets/img/custom/piece/emptyTrigger.png';
    case ActionType.BRANCH:
      return 'assets/img/custom/piece/branch_mention.png';
    case TriggerType.WEBHOOK:
      return 'assets/img/custom/piece/wehook_mention.png';
    case ActionType.LOOP_ON_ITEMS:
      return 'assets/img/custom/piece/loop_mention.png';
    case ActionType.CODE:
      return 'assets/img/custom/piece/code_mention.png';
    case ActionType.MISSING:
      // TODO EDIT
      return 'assets/img/custom/piece/emptyTrigger.png';
  }
}

const selectIsSchduleTrigger = createSelector(selectCurrentFlow, (flow) => {
  if (flow?.version?.trigger.type === TriggerType.PIECE) {
    return flow.version.trigger.settings.pieceName === 'schedule';
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
    selectAllFlowSteps,
    selectAllFlowItemsDetails,
    (steps, flowItemsDetails) => {
      const step = steps.find((s) => s.name === stepName);
      if (!step) {
        return 'assets/img/custom/piece/branch_mention.png';
      }
      const logoUrl = findStepLogoUrlForMentions(step, flowItemsDetails);
      return logoUrl;
    }
  );
};
export const BuilderSelectors = {
  selectReadOnly,
  selectViewMode,
  selectCurrentFlowRun,
  selectCurrentFlow,
  selectCurrentInstance,
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
  selectAppConnectionsDropdownOptions,
  selectFlowItemDetailsForCustomPiecesTriggers,
  selectAllAppConnections,
  selectAllFlowSteps,
  selectAllStepsForMentionsDropdown,
  selectAppConnectionsForMentionsDropdown,
  selectStepLogoUrl,
  selectCurrentStepSettings,
  selectTriggerSelectedSampleData,
  selectStepValidity,
  selectCurrentFlowVersionId,
  selectIsSchduleTrigger,
  selectCurrentStepPieceVersionAndName,
  selectCurrentFlowFolderName,
  selectStepTestSampleData,
  selectLastTestDate,
  selectNumberOfInvalidSteps,
  selectIsGeneratingFlowComponentOpen,
  selectMissingStepRecommendedFlowItemsDetails,
  selectStepTestSampleDataStringified,
};
