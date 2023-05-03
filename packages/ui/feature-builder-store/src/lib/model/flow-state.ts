import { Flow, Folder } from '@activepieces/shared';
import { BuilderState } from './builder-state';
import { BuilderSavingStatusEnum } from './enums';
import { UUID } from 'angular2-uuid';

export interface FlowState {
  flow: Flow;
  folder?: Folder;
  builderState: BuilderState;
  savingStatus: BuilderSavingStatusEnum;
  lastSaveId: UUID;
}
