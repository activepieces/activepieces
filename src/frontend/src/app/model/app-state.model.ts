import { GlobalBuilderState } from '../layout/flow-builder/store/model/builder-state.model';
import { CommonStateModel } from '../layout/common-layout/store/model/common-state.model';

export interface AppState {
	readonly builderState: GlobalBuilderState;
	readonly commonState: CommonStateModel;
}
