import { GlobalBuilderState } from '../modules/flow-builder/store/model/builder-state.model';
import { CommonStateModel } from '../modules/common/store/common-state.model';

export interface AppState {
  readonly builderState: GlobalBuilderState;
  readonly commonState: CommonStateModel;
}
