import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GlobalBuilderState } from '../model/builder-state.model';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';
import { LeftSideBarType } from '../../../common/model/enum/left-side-bar-type.enum';
import {
  AppConnection,
  Flow,
  FlowRun,
  PieceActionSettings,
} from '@activepieces/shared';
import { TabState } from '../model/tab-state';
import { ViewModeEnum } from '../model/enums/view-mode.enum';
import { FlowItem } from '../../../common/model/flow-builder/flow-item';
import {
  FlowItemsDetailsState,
  StepMetaData,
} from '../model/flow-items-details-state.model';
import { FlowsState } from '../model/flows-state.model';
import { CollectionStateEnum } from '../model/enums/collection-state.enum';
import { ActionType, Collection, TriggerType } from '@activepieces/shared';
import { FlowStructureUtil } from '../../service/flowStructureUtil';
import { ConnectionDropdownItem } from '../../../common/model/dropdown-item.interface';
import { MentionListItem } from '../../../common/components/form-controls/interpolating-text-form-control/utils';

export const BUILDER_STATE_NAME = 'builderState';

export const selectBuilderState =
  createFeatureSelector<GlobalBuilderState>(BUILDER_STATE_NAME);

export const selectCurrentCollection = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.collectionState.collection
);

export const selectCurrentCollectionId = createSelector(
  selectCurrentCollection,
  (collection: Collection) => collection.id
);
export const selectCurrentCollectionInstance = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.collectionState.instance;
  }
);

export const selectCollectionState = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.collectionState.state
);
export const selectIsPublishing = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) =>
    (state.collectionState.state & CollectionStateEnum.PUBLISHING) ===
    CollectionStateEnum.PUBLISHING
);
export const selectIsSaving = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) =>
    (state.collectionState.state & CollectionStateEnum.SAVING_COLLECTION) ===
      CollectionStateEnum.SAVING_COLLECTION ||
    (state.collectionState.state & CollectionStateEnum.SAVING_FLOW) ===
      CollectionStateEnum.SAVING_FLOW
);
export const selectViewMode = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.viewMode
);

export const selectInstanceRunView = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) =>
    state.viewMode === ViewModeEnum.VIEW_INSTANCE_RUN
);

export const selectReadOnly = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.viewMode !== ViewModeEnum.BUILDING
);

export const selectFlows = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.flowsState.flows
);
export const selectFlowsValidity = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    const allFlowsValidity = state.flowsState.flows.map(
      (f) => f.version!.valid
    );
    return allFlowsValidity.reduce(
      (current, previous) => current && previous,
      true
    );
  }
);

export const selectFlowsCount = createSelector(
  selectFlows,
  (flows: Flow[]) => flows.length
);

export const selectCanPublish = createSelector(selectFlows, (flows: Flow[]) => {
  let canPublish = true;
  for (let i = 0; i < flows.length; ++i) {
    if (!flows[i].version?.valid) {
      canPublish = false;
    }
  }
  return flows.length > 0 && canPublish;
});

export const selectCurrentFlowId = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => state.flowsState.selectedFlowId
);

export const selectFlowsState = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowsState;
  }
);

export const selectCurrentFlow = createSelector(
  selectFlowsState,
  (flowsState: FlowsState) => {
    return flowsState.flows.find((f) => f.id === flowsState.selectedFlowId);
  }
);

export const selectTabState = (flowId: string) =>
  createSelector(selectFlowsState, (state: FlowsState): TabState => {
    return state.tabsState[flowId.toString()];
  });

export const selectFlow = (flowId: string) =>
  createSelector(selectFlowsState, (state: FlowsState): Flow | undefined => {
    return state.flows.find((f) => f.id === flowId);
  });
export const selectCurrentFlowValidity = createSelector(
  selectCurrentFlow,
  (flow: Flow | undefined) => {
    if (!flow) return false;

    return flow.version!.valid;
  }
);

export const selectFlowSelectedId = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    return state.flowsState.selectedFlowId !== undefined;
  }
);

export const selectCurrentStep = createSelector(
  selectFlowsState,
  (flowsState: FlowsState) => {
    const selectedFlowTabsState =
      flowsState.tabsState[flowsState.selectedFlowId!.toString()];
    if (!selectedFlowTabsState) {
      return undefined;
    }
    return selectedFlowTabsState.focusedStep;
  }
);
export const selectCurrentStepName = createSelector(
  selectCurrentStep,
  (selectedStep) => {
    if (selectedStep) {
      return selectedStep.name;
    }
    return null;
  }
);
export const selectCurrentDisplayName = createSelector(
  selectCurrentStep,
  (state) => {
    return state?.displayName;
  }
);
export const selectCurrentTabState = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    if (state.flowsState.selectedFlowId == undefined) {
      return undefined;
    }
    return state.flowsState.tabsState[
      state.flowsState.selectedFlowId.toString()
    ];
  }
);

export const selectCurrentFlowRun = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    if (state.flowsState.selectedFlowId == undefined) {
      return undefined;
    }
    const tabState =
      state.flowsState.tabsState[state.flowsState.selectedFlowId.toString()];
    if (tabState == null) {
      return tabState;
    }
    return tabState.selectedRun;
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

export const selectCurrentLeftSidebar = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    if (state.flowsState.selectedFlowId == undefined) {
      return {
        type: LeftSideBarType.NONE,
        props: {},
      };
    }
    const tabState: TabState =
      state.flowsState.tabsState[state.flowsState.selectedFlowId.toString()];
    if (tabState == undefined) {
      return {
        type: LeftSideBarType.NONE,
        props: {},
      };
    }
    return tabState.leftSidebar;
  }
);

export const selectCurrentLeftSidebarType = createSelector(
  selectCurrentLeftSidebar,
  (state: { type: LeftSideBarType }) => {
    return state.type;
  }
);

export const selectCurrentRightSideBar = createSelector(
  selectBuilderState,
  (state: GlobalBuilderState) => {
    if (state.flowsState.selectedFlowId == undefined) {
      return {
        type: RightSideBarType.NONE,
        props: {},
      };
    }
    const tabState: TabState =
      state.flowsState.tabsState[state.flowsState.selectedFlowId.toString()];
    if (tabState == undefined) {
      return {
        type: RightSideBarType.NONE,
        props: {},
      };
    }
    return tabState.rightSidebar;
  }
);

export const selectCurrentRightSideBarType = createSelector(
  selectCurrentRightSideBar,
  (state: { type: RightSideBarType }) => {
    return state.type;
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
    const triggerItemDetails = state.coreTriggerFlowItemsDetails.find(
      (t) => t.type === flowItem.type
    );
    if (triggerItemDetails) {
      return triggerItemDetails;
    }
    if (
      (flowItem.settings as PieceActionSettings)?.pieceName == 'storage' ||
      (flowItem.settings as PieceActionSettings)?.pieceName == 'http'
    ) {
      const details = state.coreFlowItemsDetails.find(
        (p) =>
          p.extra?.appName ===
          (flowItem.settings as PieceActionSettings)?.pieceName
      );
      if (!details) {
        throw new Error(
          `${
            (flowItem.settings as PieceActionSettings)?.pieceName
          } not found in core nor custom pieces details`
        );
      }
      return details;
    }
    if (flowItem.type === ActionType.PIECE) {
      return state.customPiecesActionsFlowItemDetails.find(
        (f) => f.extra!.appName === flowItem.settings.pieceName
      );
    }
    if (flowItem.type === TriggerType.PIECE) {
      return state.customPiecesTriggersFlowItemDetails.find(
        (f) => f.extra!.appName === flowItem.settings.pieceName
      );
    }

    //Core items might contain remote flows so always have them at the end
    const coreItemDetials = state.coreFlowItemsDetails.find(
      (c) => c.type === flowItem.type
    );

    if (!coreItemDetials) {
      console.warn(
        `Flow item details for ${flowItem.displayName} are not currently loaded`
      );
    }
    return coreItemDetials;
  });

const selectAllAppConnections = createSelector(
  selectBuilderState,
  (globalState) => globalState.appConnectionsState.connections
);

export const selectConnection = (connectionName: string) =>
  createSelector(selectAllAppConnections, (connections: AppConnection[]) => {
    return connections.find((c) => c.name === connectionName)!;
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
const selectAllFlowStepsMetaData = createSelector(
  selectAllFlowSteps,
  selectAllFlowItemsDetails,
  (steps, flowItemDetails): StepMetaData[] => {
    return steps.map((s) => {
      const logoUrl = findStepLogoUrl(s, flowItemDetails);
      return {
        displayName: s.displayName,
        name: s.name,
        logoUrl: logoUrl,
      };
    });
  }
);
const selectAllStepsForMentionsDropdown = createSelector(
  selectCurrentStep,
  selectCurrentFlow,
  (currentStep, flow): (MentionListItem & { step: FlowItem })[] => {
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
      };
    });
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
const selectAnyFlowHasSteps = createSelector(selectFlows, (flows: Flow[]) => {
  let aFlowHasSteps = false;
  flows.forEach((f) => {
    aFlowHasSteps = aFlowHasSteps || !!f.version?.trigger?.nextAction;
  });
  return aFlowHasSteps;
});

function findStepLogoUrl(
  step: FlowItem,
  flowItemsDetailsState: FlowItemsDetailsState
) {
  if (step.type === ActionType.PIECE) {
    if (step.settings.pieceName === 'storage') {
      return 'assets/img/custom/piece/storage.png';
    }
    if (step.settings.pieceName === 'http') {
      return 'assets/img/custom/piece/http.png';
    }
    return flowItemsDetailsState.customPiecesActionsFlowItemDetails.find(
      (i) => i.extra?.appName === step.settings.pieceName
    )!.logoUrl!;
  } else if (step.type === TriggerType.PIECE) {
    return flowItemsDetailsState.customPiecesTriggersFlowItemDetails.find(
      (i) => i.extra?.appName === step.settings.pieceName
    )!.logoUrl!;
  } else {
    if (
      step.type === TriggerType.EMPTY ||
      step.type === TriggerType.SCHEDULE ||
      step.type === TriggerType.WEBHOOK
    ) {
      const fileName =
        step.type === TriggerType.EMPTY
          ? 'emptyTrigger.png'
          : step.type === TriggerType.SCHEDULE
          ? 'schedule.png'
          : 'webhook.png';
      return 'assets/img/custom/piece/' + fileName;
    }
    return 'assets/img/custom/piece/code.png';
  }
}
export const BuilderSelectors = {
  selectCurrentCollection,
  selectCurrentCollectionId,
  selectReadOnly,
  selectViewMode,
  selectCurrentFlowId,
  selectCurrentFlowRun,
  selectFlows,
  selectCurrentTabState,
  selectFlowSelectedId,
  selectCurrentFlow,
  selectCurrentRightSideBar,
  selectCurrentStep,
  selectCanPublish,
  selectCurrentLeftSidebar,
  selectCurrentLeftSidebarType,
  selectFlowsCount,
  selectCurrentStepName,
  selectCurrentRightSideBarType,
  selectCurrentFlowRunStatus,
  selectCurrentDisplayName,
  selectInstanceRunView,
  selectCollectionState,
  selectIsSaving,
  selectFlow,
  selectTabState,
  selectAllFlowItemsDetails,
  selectFlowItemDetails,
  selectAllFlowItemsDetailsLoadedState,
  selectCoreFlowItemsDetails,
  selectFlowItemDetailsForCoreTriggers,
  selectCurrentFlowValidity,
  selectFlowsValidity,
  selectFlowItemDetailsForCustomPiecesActions,
  selectAppConnectionsDropdownOptions,
  selectCurrentCollectionInstance,
  selectIsPublishing,
  selectFlowItemDetailsForCustomPiecesTriggers,
  selectAllAppConnections,
  selectAllFlowSteps,
  selectAllFlowStepsMetaData,
  selectAllStepsForMentionsDropdown,
  selectAppConnectionsForMentionsDropdown,
  selectAnyFlowHasSteps,
};
