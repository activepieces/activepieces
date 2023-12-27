import { FlowVersion, Folder, PopulatedFlow } from '@activepieces/shared';
import { BuilderSavingStatusEnum } from './enums';
import { UUID } from 'angular2-uuid';

export interface FlowState {
  /**flow will always have draft version but will have publishedFlowVersion only if publishedFlowVersionId !== null */
  flow: PopulatedFlow & { publishedFlowVersion?: FlowVersion };
  folder?: Folder;
  savingStatus: BuilderSavingStatusEnum;
  lastSaveId: UUID;
}
