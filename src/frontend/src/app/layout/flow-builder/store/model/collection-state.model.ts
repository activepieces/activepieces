import { Collection } from 'src/app/layout/common-layout/model/piece.interface';
import { PieceStateEnum } from './enums/piece-state.enum';

export interface CollectionState {
	collection: Collection;
	state: PieceStateEnum;
}
