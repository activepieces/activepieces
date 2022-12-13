import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GlobalBuilderState } from '../model/builder-state.model';
import { RightSideBarType } from '../../../common-layout/model/enum/right-side-bar-type.enum';
import { LeftSideBarType } from '../../../common-layout/model/enum/left-side-bar-type.enum';
import { Flow } from '../../../common-layout/model/flow.class';
import { TabState } from '../model/tab-state';
import { ViewModeEnum } from '../model/enums/view-mode.enum';
import { UUID } from 'angular2-uuid';
import { InstanceRun } from '../../../common-layout/model/instance-run.interface';
import { DropdownItemOption } from '../../../common-layout/model/fields/variable/subfields/dropdown-item-option';
import { FlowItem } from '../../../common-layout/model/flow-builder/flow-item';
import { Config } from '../../../common-layout/model/fields/variable/config';
import { FlowItemsDetailsState } from '../model/flow-items-details-state.model';
import { FlowsState } from '../model/flows-state.model';
import { TriggerType } from 'src/app/layout/common-layout/model/enum/trigger-type.enum';
import { ActionType } from '../../../common-layout/model/enum/action-type.enum';
import { ConfigType } from 'src/app/layout/common-layout/model/enum/config-type';
import { Collection } from 'src/app/layout/common-layout/model/collection.interface';
import { CollectionStateEnum } from '../model/enums/collection-state.enum';
import { AuthConfigDropdownValue } from '../../page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/component-input-form/component-input-form.component';

export const BUILDER_STATE_NAME = 'builderState';

export const selectBuilderState = createFeatureSelector<GlobalBuilderState>(BUILDER_STATE_NAME);

export const selectCurrentCollection = createSelector(
	selectBuilderState,
	(state: GlobalBuilderState) => state.collectionState.collection
);

export const selectCurrentCollectionId = createSelector(
	selectCurrentCollection,
	(collection: Collection) => collection.id
);
export const selectCurrentCollectionInstance = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	return state.collectionState.instance;
});

export const selectCurrentCollectionName = createSelector(
	selectCurrentCollection,
	(collection: Collection) => collection.name
);

export const selectCurrentCollectionConfigs = createSelector(selectCurrentCollection, (collection: Collection) => {
	return collection.last_version.configs.map(c => {
		return { ...c, collectionVersionId: collection.last_version.id };
	});
});

export const selectCollectionState = createSelector(
	selectBuilderState,
	(state: GlobalBuilderState) => state.collectionState.state
);
export const selectIsDeploying = createSelector(
	selectBuilderState,
	(state: GlobalBuilderState) =>
		(state.collectionState.state & CollectionStateEnum.DEPLOYING) === CollectionStateEnum.DEPLOYING
);
export const selectIsSaving = createSelector(
	selectBuilderState,
	(state: GlobalBuilderState) =>
		(state.collectionState.state & CollectionStateEnum.SAVING_COLLECTION) === CollectionStateEnum.SAVING_COLLECTION ||
		(state.collectionState.state & CollectionStateEnum.SAVING_FLOW) === CollectionStateEnum.SAVING_FLOW
);
export const selectViewMode = createSelector(selectBuilderState, (state: GlobalBuilderState) => state.viewMode);

export const selectInstanceRunView = createSelector(
	selectBuilderState,
	(state: GlobalBuilderState) => state.viewMode === ViewModeEnum.VIEW_INSTANCE_RUN
);

export const selectReadOnly = createSelector(
	selectBuilderState,
	(state: GlobalBuilderState) => state.viewMode !== ViewModeEnum.BUILDING
);

export const selectFlows = createSelector(selectBuilderState, (state: GlobalBuilderState) => state.flowsState.flows);
export const selectFlowsValidity = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	const allFlowsValidity = state.flowsState.flows.map(f => f.last_version.valid);
	return allFlowsValidity.reduce((current, previous) => current && previous, true);
});

export const selectFlowsCount = createSelector(selectFlows, (flows: Flow[]) => flows.length);

export const selectCanPublish = createSelector(selectFlows, (flows: Flow[]) => {
	let canPublish = true;
	for (let i = 0; i < flows.length; ++i) {
		if (!flows[i].last_version?.valid) {
			canPublish = false;
		}
	}
	return flows.length > 0 && canPublish;
});

export const selectCurrentFlowId = createSelector(
	selectBuilderState,
	(state: GlobalBuilderState) => state.flowsState.selectedFlowId
);

export const selectDynamicDropdownReference = () =>
	createSelector(selectCurrentCollectionConfigs, (flowConfigs: Config[], pieceConfigs: Config[]) => {
		return [...flowConfigs, ...pieceConfigs]
			.filter(f => f.type == ConfigType.OAUTH2)
			.map(f => {
				return { value: f.key, label: f.label } as DropdownItemOption;
			});
	});

export const selectAuth2Configs = createSelector(selectCurrentCollectionConfigs, (collectionConfigs: Config[]) => {
	return [...collectionConfigs].filter(f => f.type == ConfigType.OAUTH2);
});

export const selectAllConfigs = createSelector(selectCurrentCollectionConfigs, (collectionConfigs: Config[]) => {
	return [...collectionConfigs];
});
export const selectFlowsState = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	return state.flowsState;
});

export const selectCurrentFlow = createSelector(selectFlowsState, (flowsState: FlowsState) => {
	return flowsState.flows.find(f => f.id === flowsState.selectedFlowId);
});

export const selectTabState = (flowId: UUID) =>
	createSelector(selectFlowsState, (state: FlowsState): TabState => {
		return state.tabsState[flowId.toString()];
	});

export const selectFlow = (flowId: UUID) =>
	createSelector(selectFlowsState, (state: FlowsState): Flow | undefined => {
		return state.flows.find(f => f.id === flowId);
	});
export const selectCurrentFlowValidity = createSelector(selectCurrentFlow, (flow: Flow | undefined) => {
	if (!flow) return false;

	return flow.last_version.valid;
});

export const selectFlowSelectedId = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	return state.flowsState.selectedFlowId !== undefined;
});

export const selectCurrentStep = createSelector(selectFlowsState, (flowsState: FlowsState) => {
	const selectedFlowTabsState = flowsState.tabsState[flowsState.selectedFlowId!.toString()];
	if (!selectedFlowTabsState) {
		return undefined;
	}
	return selectedFlowTabsState.focusedStep;
});
export const selectCurrentStepName = createSelector(selectCurrentStep, selectedStep => {
	if (selectedStep) {
		return selectedStep.name;
	}
	return null;
});
export const selectCurrentDisplayName = createSelector(selectCurrentStep, state => {
	return state?.display_name;
});
export const selectCurrentTabState = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	if (state.flowsState.selectedFlowId == undefined) {
		return undefined;
	}
	return state.flowsState.tabsState[state.flowsState.selectedFlowId.toString()];
});

export const selectCurrentFlowRun = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	if (state.flowsState.selectedFlowId == undefined) {
		return undefined;
	}
	const tabState = state.flowsState.tabsState[state.flowsState.selectedFlowId.toString()];
	if (tabState == null) {
		return tabState;
	}
	return tabState.selectedRun;
});

export const selectCurrentFlowRunStatus = createSelector(selectCurrentFlowRun, (run: InstanceRun | undefined) => {
	if (run === undefined) {
		return undefined;
	}
	return run.status;
});

export const selectCurrentLeftSidebar = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	if (state.flowsState.selectedFlowId == undefined) {
		return {
			type: LeftSideBarType.NONE,
			props: {},
		};
	}
	const tabState: TabState = state.flowsState.tabsState[state.flowsState.selectedFlowId.toString()];
	if (tabState == undefined) {
		return {
			type: LeftSideBarType.NONE,
			props: {},
		};
	}
	return tabState.leftSidebar;
});

export const selectCurrentLeftSidebarType = createSelector(
	selectCurrentLeftSidebar,
	(state: { type: LeftSideBarType }) => {
		return state.type;
	}
);

export const selectCurrentRightSideBar = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	if (state.flowsState.selectedFlowId == undefined) {
		return {
			type: RightSideBarType.NONE,
			props: {},
		};
	}
	const tabState: TabState = state.flowsState.tabsState[state.flowsState.selectedFlowId.toString()];
	if (tabState == undefined) {
		return {
			type: RightSideBarType.NONE,
			props: {},
		};
	}
	return tabState.rightSidebar;
});

export const selectCurrentRightSideBarType = createSelector(
	selectCurrentRightSideBar,
	(state: { type: RightSideBarType }) => {
		return state.type;
	}
);

export const selectAllFlowItemsDetails = createSelector(selectBuilderState, (state: GlobalBuilderState) => {
	return state.flowItemsDetailsState;
});
export const selectAllFlowItemsDetailsLoadedState = createSelector(
	selectAllFlowItemsDetails,
	(state: FlowItemsDetailsState) => {
		return state.loaded;
	}
);

export const selectCoreFlowItemsDetails = createSelector(selectAllFlowItemsDetails, (state: FlowItemsDetailsState) => {
	return state.coreFlowItemsDetails;
});

export const selectFlowItemDetailsForTriggers = createSelector(
	selectAllFlowItemsDetails,
	(state: FlowItemsDetailsState) => {
		return state.triggerFlowItemsDetails.filter(details => details.type !== TriggerType.EMPTY);
	}
);
export const selectFlowItemDetailsForConnectorComponents = createSelector(
	selectAllFlowItemsDetails,
	(state: FlowItemsDetailsState) => {
		return state.connectorComponentsFlowItemDetails;
	}
);

export const selectFlowItemDetails = (flowItem: FlowItem) =>
	createSelector(selectAllFlowItemsDetails, (state: FlowItemsDetailsState) => {
		const triggerItemDetails = state.triggerFlowItemsDetails.find(t => t.type === flowItem.type);
		if (triggerItemDetails) {
			return triggerItemDetails;
		}
		if (flowItem.type === ActionType.COMPONENT) {
			return state.connectorComponentsFlowItemDetails.find(f => f.name === flowItem.settings.component_name);
		}

		//Core items might contain remote flows so always have them at the end
		let coreItemDetials = state.coreFlowItemsDetails.find(c => c.type === flowItem.type);

		if (!coreItemDetials) {
			console.warn(`Flow item details for ${flowItem.display_name} are not currently loaded`);
		}
		return coreItemDetials;
	});

export const selectConfig = (configKey: string) =>
	createSelector(selectCurrentCollectionConfigs, (collectionConfigs: Config[]) => {
		const indexInCollectionConfigsList = collectionConfigs.findIndex(c => c.key === configKey);
		if (indexInCollectionConfigsList > -1) {
			return {
				indexInList: indexInCollectionConfigsList,
				config: collectionConfigs[indexInCollectionConfigsList],
			};
		}
		return undefined;
	});
export const selectAuthConfigsDropdownOptions = createSelector(
	selectCurrentCollectionConfigs,
	(collectionConfigs: Config[]) => {
		return [...collectionConfigs]
			.filter(c => c.type === ConfigType.OAUTH2)
			.map(c => {
				const result: { label: string; value: AuthConfigDropdownValue } = {
					label: c.key,
					value: { configInterpolation: `\${configs.${c.key}}`, accessToken: c.value['access_token'] },
				};
				return result;
			});
	}
);
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
	selectCurrentCollectionName,
	selectCanPublish,
	selectCurrentLeftSidebar,
	selectCurrentLeftSidebarType,
	selectFlowsCount,
	selectCurrentStepName,
	selectCurrentCollectionConfigs,
	selectCurrentRightSideBarType,
	selectDynamicDropdownReference,
	selectCurrentFlowRunStatus,
	selectCurrentDisplayName,
	selectAuth2Configs,
	selectInstanceRunView,
	selectCollectionState,
	selectIsSaving,
	selectFlow,
	selectTabState,
	selectAllFlowItemsDetails,
	selectFlowItemDetails,
	selectAllFlowItemsDetailsLoadedState,
	selectCoreFlowItemsDetails,
	selectFlowItemDetailsForTriggers,
	selectCurrentFlowValidity,
	selectAllConfigs,
	selectConfig,
	selectFlowsValidity,
	selectFlowItemDetailsForConnectorComponents,
	selectAuthConfigsDropdownOptions,
	selectCurrentCollectionInstance,
	selectIsDeploying,
};
