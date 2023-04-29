import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GlobalBuilderState } from '../../model/builder-state.model';

import { AppConnection, Flow, FlowRun } from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';

import { FlowItemsDetailsState } from '../../model/flow-items-details-state.model';
import { ActionType, TriggerType } from '@activepieces/shared';
import { FlowItem } from '../../model/flow-item';
import { MentionListItem } from '../../model/mention-list-item';
import { FlowStructureUtil } from '../../utils/flowStructureUtil';
import { ConnectionDropdownItem } from '../../model/connections-dropdown-item';
import { BuilderStateEnum } from '../../model';
import {
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  corePieceIconUrl,
} from '@activepieces/ui/common';

export const BUILDER_STATE_NAME = 'builderState';

export const selectBuilderState =
  createFeatureSelector<GlobalBuilderState>(BUILDER_STATE_NAME);

export const selectIsPublishing = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.state === BuilderStateEnum.PUBLISHING
);

export const selectIsSaving = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.state === BuilderStateEnum.SAVING_FLOW
);

export const selectFlowHasAnySteps = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) =>
    !!state.flowState.flow.version.trigger?.nextAction
);

export const selectViewMode = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.viewMode
);

export const selectIsInDebugMode = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) =>
    state.viewMode === ViewModeEnum.VIEW_INSTANCE_RUN
);

export const selectReadOnly = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.viewMode !== ViewModeEnum.BUILDING
);

export const selectCurrentInstance = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.instance;
  }
);

export const selectCurrentFlow = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.flow;
  }
);
export const selectCurrentFlowFolderName = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    if (!state.flowState.folder) {
      return 'Uncategorized';
    }
    return state.flowState.folder.displayName;
  }
);

export const selectSearchItems = (command: string) =>
  createSelector(selectBuilderState, (state: GlobalBuilderState) => {
    return [
      {
        label: 'View Runs',
        value: 'runs',
        icon: '/assets/img/custom/dashboard/runs.svg',
        type: 'RUNS',
      },
    ];
  });

export const selectTabState = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.state
);
export const selectCurrentFlowValidity = createSelector(
  selectCurrentFlow,
  (flow: Flow | undefined) => {
    if (!flow) return false;
    return flow.version?.valid || false;
  }
);

export const selectCurrentStep = createSelector(
  selectBuilderState,
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

export const selectCurrentFlowRun = createSelector(
  selectBuilderState,
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

export const selectCurrentLeftSidebarType = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.builderState.leftSidebar.type;
  }
);

export const selectCurrentRightSideBar = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.builderState.rightSidebar;
  }
);

export const selectCurrentRightSideBarType = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowState.builderState.rightSidebar.type;
  }
);

export const selectAllFlowItemsDetails = createSelector(
  selectBuilderState,
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
  selectBuilderState,
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
  if (step.type === ActionType.PIECE) {
    if (CORE_PIECES_ACTIONS_NAMES.find((n) => n === step.settings.pieceName)) {
      return corePieceIconUrl(step.settings.pieceName);
    }
    return flowItemsDetailsState.customPiecesActionsFlowItemDetails.find(
      (i) => i.extra?.appName === step.settings.pieceName
    )?.logoUrl;
  } else if (step.type === TriggerType.PIECE) {
    if (CORE_PIECES_TRIGGERS.find((n) => n === step.settings.pieceName)) {
      return corePieceIconUrl(step.settings.pieceName);
    }
    return flowItemsDetailsState.customPiecesTriggersFlowItemDetails.find(
      (i) => i.extra?.appName === step.settings.pieceName
    )?.logoUrl;
  } else {
    if (step.type === TriggerType.EMPTY || step.type === TriggerType.WEBHOOK) {
      const fileName =
        step.type === TriggerType.EMPTY
          ? 'emptyTrigger.png'
          : 'webhook_mention.png';
      return 'assets/img/custom/piece/' + fileName;
    }
    if (step.type === ActionType.LOOP_ON_ITEMS) {
      return 'assets/img/custom/piece/loop_mention.png';
    }
    return 'assets/img/custom/piece/code_mention.png';
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
  selectTabState,
  selectAllFlowItemsDetails,
  selectFlowItemDetails,
  selectSearchItems,
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
};
