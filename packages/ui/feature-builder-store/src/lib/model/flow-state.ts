import { FlowVersion, PopulatedFlow } from '@activepieces/shared';
import { BuilderSavingStatusEnum } from './enums';
import { UUID } from 'angular2-uuid';

export interface FlowState {
  /**flow will always have draft version but will have publishedFlowVersion only if publishedFlowVersionId !== null */
  flow: PopulatedFlow & { publishedFlowVersion?: FlowVersion };
  savingStatus: BuilderSavingStatusEnum;
  lastSaveId: UUID;
}
