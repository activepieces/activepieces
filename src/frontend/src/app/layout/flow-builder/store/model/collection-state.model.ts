import { Collection } from 'src/app/layout/common-layout/model/collection.interface';
import { CollectionStateEnum } from './enums/collection-state.enum';

export interface CollectionState {
	collection: Collection;
	state: CollectionStateEnum;
}
