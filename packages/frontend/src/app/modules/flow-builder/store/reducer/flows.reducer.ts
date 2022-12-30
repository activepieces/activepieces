// // import the interface

import { Action, createReducer, on } from '@ngrx/store';
import { Flow } from '../../../common/model/flow.class';
import { FlowsActions } from '../action/flows.action';
import { UUID } from 'angular2-uuid';
import { FlowVersion } from '../../../common/model/flow-version.class';
import { TabState } from '../model/tab-state';
import { LeftSideBarType } from '../../../common/model/enum/left-side-bar-type.enum';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';
import { FlowStructureUtil } from '../../service/flowStructureUtil';

type FlowsState = {
	flows: Flow[];
	tabsState: { [key: string]: TabState };
	selectedFlowId?: UUID;
};

const initialState: FlowsState = {
	flows: [],
	tabsState: {},
	selectedFlowId: undefined,
};

const initialTabState: TabState = {
	selectedRun: undefined,
	leftSidebar: {
		type: LeftSideBarType.NONE,
	},
	rightSidebar: {
		type: RightSideBarType.NONE,
		props: {},
	},
	focusedStep: null,
	selectedStepName: 'initialVal',
};

const _flowsReducer = createReducer(
	initialState,
	on(FlowsActions.setInitial, (state, { flows, run }): FlowsState => {
		const clonedFlows: Flow[] = JSON.parse(JSON.stringify(flows));
		let selectedFlowId: UUID | undefined = undefined;
		if (clonedFlows.length > 0) {
			selectedFlowId = clonedFlows[0].id;
		}
		const tabsState = {};
		clonedFlows.forEach(f => {
			tabsState[f.id.toString()] = JSON.parse(JSON.stringify(initialTabState));
		});
		if (run !== undefined && run !== null) {
			tabsState[flows[0].id.toString()].selectedRun = run;
		}
		return {
			flows: clonedFlows,
			tabsState: tabsState,
			selectedFlowId: selectedFlowId,
		};
	}),
	on(FlowsActions.selectFlow, (state, { flowId }): FlowsState => {
		return { ...state, selectedFlowId: flowId };
	}),
	on(FlowsActions.replaceTrigger, (state, { newTrigger }): FlowsState => {
		if (state.selectedFlowId === null) {
			throw new Error('Selected flow id is null');
		}

		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const clonedFlows = clonedState.flows;
		const flowIndex = clonedFlows.findIndex(f => f.id === state.selectedFlowId);
		if (flowIndex != -1) {
			clonedFlows[flowIndex].version = FlowVersion.clone(clonedFlows[flowIndex].version).replaceTrigger(
				newTrigger
			);
		}
		clonedState.tabsState[state.selectedFlowId!.toString()].focusedStep = newTrigger;
		return {
			...state,
			flows: clonedFlows,
			selectedFlowId: state.selectedFlowId,
		};
	}),
	on(FlowsActions.dropPiece, (state, { draggedPieceName, newParentName }): FlowsState => {
		const clonedFlows: Flow[] = JSON.parse(JSON.stringify(state)).flows;
		const flowIndex = clonedFlows.findIndex(f => f.id === state.selectedFlowId);
		if (flowIndex != -1) {
			clonedFlows[flowIndex].version = FlowVersion.clone(clonedFlows[flowIndex].version);
			clonedFlows[flowIndex].version.dropPiece(draggedPieceName, newParentName);
		}
		clonedFlows[flowIndex].version.valid = false;
		return {
			...state,
			flows: clonedFlows,
			selectedFlowId: state.selectedFlowId,
		};
	}),
	on(FlowsActions.addStep, (state, { newAction }): FlowsState => {
		if (state.selectedFlowId === null) {
			throw new Error('Selected flow id is null');
		}
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const clonedFlows = clonedState.flows;
		const flowIndex = clonedFlows.findIndex(f => f.id === state.selectedFlowId);
		const tabeState = state.tabsState[state.selectedFlowId!.toString()];

		if (flowIndex != -1) {
			clonedFlows[flowIndex].version = FlowVersion.clone(clonedFlows[flowIndex].version).addNewChild(
				tabeState.rightSidebar.props.stepName,
				newAction,
				tabeState.rightSidebar.props.buttonType
			);
		}
		return {
			...state,
			flows: clonedFlows,
			selectedFlowId: state.selectedFlowId,
		};
	}),
	on(FlowsActions.updateStep, (state, { stepName, newStep }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const clonedFlows = clonedState.flows;
		const clonedTabsState = {
			...clonedState.tabsState,
		};
		clonedTabsState[state.selectedFlowId!.toString()] = {
			...clonedState.tabsState[state.selectedFlowId!.toString()],
			focusedStep: { ...newStep },
		};
		const flowIndex = clonedFlows.findIndex(f => f.id === state.selectedFlowId);
		if (flowIndex != -1) {
			clonedFlows[flowIndex].version = FlowVersion.clone(clonedFlows[flowIndex].version).updateStep(
				stepName,
				newStep
			);
		}
		return {
			...state,
			tabsState: clonedTabsState,
			flows: clonedFlows,
			selectedFlowId: state.selectedFlowId,
		};
	}),
	on(FlowsActions.deleteStep, (state, { stepName }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const clonedFlows = clonedState.flows;
		const flowIndex = clonedFlows.findIndex(f => f.id === state.selectedFlowId);
		if (flowIndex != -1) {
			clonedFlows[flowIndex].version = FlowVersion.clone(clonedFlows[flowIndex].version).deleteStep(stepName);
		}
		return {
			...state,
			tabsState: clonedState.tabsState,
			flows: clonedFlows,
			selectedFlowId: state.selectedFlowId,
		};
	}),
	on(FlowsActions.changeName, (state, { flowId, displayName }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const clonedFlows = clonedState.flows;
		const flowIndex = clonedFlows.findIndex(f => f.id === flowId);
		if (flowIndex != -1) {
			clonedFlows[flowIndex].version.display_name = displayName;
		}
		return {
			...state,
			tabsState: clonedState.tabsState,
			flows: clonedFlows,
			selectedFlowId: state.selectedFlowId,
		};
	}),
	on(FlowsActions.deleteFlow, (state, { flowId }: { flowId: UUID }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const index = clonedState.flows.findIndex(f => f.id == flowId);
		if (index != -1) {
			clonedState.flows.splice(index, 1);
		}
		const deletedFlowHasNext: boolean = index < clonedState.flows.length;
		if (deletedFlowHasNext) {
			clonedState.selectedFlowId = clonedState.flows[index].id;
		} else {
			const notEmpty: boolean = clonedState.flows.length > 0;
			if (notEmpty) {
				clonedState.selectedFlowId = clonedState.flows[clonedState.flows.length - 1].id;
			} else {
				clonedState.selectedFlowId = undefined;
			}
		}
		return clonedState;
	}),
	on(FlowsActions.addFlow, (state, { flow }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		clonedState.flows.push(flow);
		clonedState.selectedFlowId = flow.id;
		clonedState.tabsState[clonedState.selectedFlowId.toString()] = JSON.parse(JSON.stringify(initialTabState));
		return clonedState;
	}),

	on(FlowsActions.savedSuccess, (state, { saveRequestId, flow }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		//in case a new version was created after the former one was locked.
		const flowSaved = clonedState.flows.find(f => f.id == flow.id)!;
		flowSaved.version.id = flow.version.id;
		flowSaved.version.state = flow.version.state;
		return { ...clonedState };
	}),
	on(FlowsActions.setLeftSidebar, (state, { sidebarType }): FlowsState => {
		if (!state.selectedFlowId) {
			throw new Error('Flow id is not selected');
		}
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const tabState: TabState = clonedState.tabsState[state.selectedFlowId.toString()];
		tabState.leftSidebar = {
			type: sidebarType,
		};
		return clonedState;
	}),
	on(FlowsActions.setRun, (state, { flowId, run }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const tabState: TabState = clonedState.tabsState[flowId.toString()];
		tabState.selectedRun = run;
		return clonedState;
	}),
	on(FlowsActions.exitRun, (state, { flowId }): FlowsState => {
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const tabState: TabState = clonedState.tabsState[flowId.toString()];
		tabState.selectedRun = undefined;
		return clonedState;
	}),
	on(FlowsActions.selectStep, (state, { step }): FlowsState => {
		if (state.selectedFlowId === undefined || state.selectedFlowId === null) {
			throw new Error('Flow id is not selected');
		}

		const clonedState = { ...state };

		const updatedTabState = {
			...clonedState.tabsState[state.selectedFlowId.toString()],
			focusedStep: { ...step },
		};
		const updatedTabStateWrapper = {};
		updatedTabStateWrapper[state.selectedFlowId.toString()] = updatedTabState;
		clonedState.tabsState = { ...clonedState.tabsState, ...updatedTabStateWrapper };
		return clonedState;
	}),
	on(FlowsActions.deselectStep, (state, {}): FlowsState => {
		if (state.selectedFlowId === undefined || state.selectedFlowId === null) {
			throw new Error('Flow id is not selected');
		}
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const tabState: TabState = clonedState.tabsState[state.selectedFlowId.toString()];
		tabState.focusedStep = null;
		return clonedState;
	}),
	on(FlowsActions.setRightSidebar, (state, { sidebarType, props }): FlowsState => {
		if (state.selectedFlowId === null || state.selectedFlowId === undefined) {
			throw new Error('Flow id is not selected');
		}
		const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
		const tabState: TabState = clonedState.tabsState[state.selectedFlowId.toString()];
		tabState.rightSidebar = {
			type: sidebarType,
			props: props,
		};
		return clonedState;
	}),
	on(FlowsActions.selectStepByName, (flowsState, { stepName }) => {
		const flow: Flow | undefined = flowsState.flows.find(f => f.id === flowsState.selectedFlowId);
		const clonedState: FlowsState = JSON.parse(JSON.stringify(flowsState));
		if (flow) {
			const step = FlowStructureUtil.findStep(flow.version.trigger, stepName);
			const updatedTabState = {
				...clonedState.tabsState[flow.id.toString()],
				focusedStep: { ...step },
			};
			const updatedTabStateWrapper = {};
			updatedTabStateWrapper[flow.id.toString()] = updatedTabState;
			clonedState.tabsState = { ...clonedState.tabsState, ...updatedTabStateWrapper };
		}
		return clonedState;
	})
);
export function flowsReducer(state: FlowsState | undefined, action: Action) {
	return _flowsReducer(state, action);
}
