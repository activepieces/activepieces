import { Folder, PopulatedFlow } from '@activepieces/shared';
import { BuilderSavingStatusEnum } from './enums';
import { UUID } from 'angular2-uuid';

export interface FlowState {
  flow: PopulatedFlow;
  folder?: Folder;
  savingStatus: BuilderSavingStatusEnum;
  lastSaveId: UUID;
}
