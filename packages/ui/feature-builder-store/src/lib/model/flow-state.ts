import { Flow, Folder } from '@activepieces/shared';
import { BuilderState } from './builder-state';
import { BuilderSavingStatusEnum } from './enums';

export interface FlowState {
  flow: Flow;
  folder?: Folder;
  builderState: BuilderState;
  savingStatus: BuilderSavingStatusEnum;
}
