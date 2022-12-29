import { UUID } from 'angular2-uuid';
import { Collection } from 'src/app/modules/common/model/collection.interface';
import { Instance } from 'src/app/modules/common/model/instance.interface';
import { CollectionStateEnum } from './enums/collection-state.enum';

export interface CollectionState {
	collection: Collection;
	state: CollectionStateEnum;
	lastSaveRequestId?: UUID;
	instance?: Instance;
}
