import { Flow, FlowInstance, Folder } from '@activepieces/shared';
import { AppConnectionsState } from './app-connections-state.model';
import { BuilderStateEnum } from './enums';
import { ViewModeEnum } from './enums/view-mode.enum';
import { FlowItemsDetailsState } from './flow-items-details-state.model';
import { BuilderState } from './builder-state';

export class GlobalBuilderState {
  readonly state: BuilderStateEnum;
  readonly flowState: {
    flow: Flow;
    folder: Folder;
    builderState: BuilderState;
  };
  readonly instance?: FlowInstance;
  readonly viewMode: ViewModeEnum;
  readonly flowItemsDetailsState: FlowItemsDetailsState;
  readonly appConnectionsState: AppConnectionsState;
}
