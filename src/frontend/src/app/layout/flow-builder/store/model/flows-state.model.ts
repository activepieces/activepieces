import { UUID } from 'angular2-uuid';
import { Flow } from 'src/app/layout/common-layout/model/flow.class';
import { FlowsStateEnum } from './enums/flows-state.enum';
import { TabState } from './tab-state';

type FlowId = string;

export interface FlowsState {
	flows: Flow[];
	tabsState: { [key: FlowId]: TabState };
	selectedFlowId: UUID | null;
	state: FlowsStateEnum;
	lastSaveId: UUID | null;
}
