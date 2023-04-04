import { UUID } from 'angular2-uuid';
import { Collection, Instance } from '@activepieces/shared';
import { CollectionStateEnum } from './enums/collection-state.enum';

export interface CollectionState {
  collection: Collection;
  state: CollectionStateEnum;
  lastSaveRequestId?: UUID;
  instance?: Instance;
}
