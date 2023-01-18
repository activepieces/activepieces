import { AppConnectionsState } from './app-connections-state.model';
import { CollectionState } from './collection-state.model';
import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowItemsDetailsState } from './flow-items-details-state.model';

import { FlowsState } from './flows-state.model';

export class GlobalBuilderState {
	readonly collectionState: CollectionState;
	readonly flowsState: FlowsState;
	readonly viewMode: ViewModeEnum;
	readonly flowItemsDetailsState: FlowItemsDetailsState;
	readonly appConnectionsState: AppConnectionsState;
}
