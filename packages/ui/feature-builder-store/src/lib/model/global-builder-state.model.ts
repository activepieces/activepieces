import { AppConnectionsState } from './app-connections-state';
import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowItemsDetailsState } from './flow-items-details-state.model';
import { FlowState } from './flow-state';
import { FlowInstanceState } from '../store/builder/flow-instance/flow-instance.reducer';

export class GlobalBuilderState {
  readonly flowState: FlowState;
  readonly instance: FlowInstanceState;
  readonly viewMode: ViewModeEnum;
  readonly flowItemsDetailsState: FlowItemsDetailsState;
  readonly appConnectionsState: AppConnectionsState;
}
