import { UUID } from 'angular2-uuid';
import { Flow } from 'src/app/modules/common/model/flow.class';
import { TabState } from './tab-state';

type FlowId = string;

export interface FlowsState {
	flows: Flow[];
	tabsState: { [key: FlowId]: TabState };
	selectedFlowId: UUID | null;
	lastSaveId: UUID | null;
}
