import { Flow, Folder } from '@activepieces/shared';
import { BuilderSavingStatusEnum } from './enums';
import { UUID } from 'angular2-uuid';

export interface FlowState {
  flow: Flow;
  folder?: Folder;
  savingStatus: BuilderSavingStatusEnum;
  lastSaveId: UUID;
}
