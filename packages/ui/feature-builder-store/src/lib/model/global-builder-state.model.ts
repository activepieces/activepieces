import { FlowInstance } from '@activepieces/shared';
import { AppConnectionsState } from './app-connections-state';
import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowItemsDetailsState } from './flow-items-details-state.model';
import { FlowState } from './flow-state';

export class GlobalBuilderState {
  readonly flowState: FlowState;
  readonly instance?: FlowInstance;
  readonly viewMode: ViewModeEnum;
  readonly flowItemsDetailsState: FlowItemsDetailsState;
  readonly appConnectionsState: AppConnectionsState;
}
