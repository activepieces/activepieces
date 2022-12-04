import { Collection } from '../../../common-layout/model/piece.interface';

import { PieceStateEnum } from './enums/piece-state.enum';

import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowItemsDetailsState } from './flow-items-details-state.model';

import { FlowsState } from './flows-state.model';

export class GlobalBuilderState {
	readonly pieceState: {
		collection: Collection;
		state: PieceStateEnum;
	};
	readonly flowsState: FlowsState;
	readonly viewMode: ViewModeEnum;
	readonly flowItemsDetailsState: FlowItemsDetailsState;
}
