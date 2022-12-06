import { Collection } from '../../../common-layout/model/collection.interface';

import { CollectionStateEnum } from './enums/collection-state.enum';

import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowItemsDetailsState } from './flow-items-details-state.model';

import { FlowsState } from './flows-state.model';

export class GlobalBuilderState {
	readonly pieceState: {
		collection: Collection;
		state: CollectionStateEnum;
	};
	readonly flowsState: FlowsState;
	readonly viewMode: ViewModeEnum;
	readonly flowItemsDetailsState: FlowItemsDetailsState;
}
