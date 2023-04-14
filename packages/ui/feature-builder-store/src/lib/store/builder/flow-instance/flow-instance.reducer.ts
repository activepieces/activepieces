import { Action, createReducer, on } from '@ngrx/store';
import { FlowInstance, FlowInstanceStatus } from '@activepieces/shared';
import { FlowInstanceActions } from './flow-instance.action';

export type FlowInstanceState = FlowInstance | undefined;
const initialState: FlowInstanceState = {
  projectId: '1',
  id: '1',
  updated: '',
  created: '',
  flowId: '1',
  flowVersionId: '1',
  status: FlowInstanceStatus.DISABLED,
};

const __flowInstanceReducer = createReducer(
  initialState,
  on(FlowInstanceActions.setInitial, (state, { instance }): FlowInstance => {
    return instance;
  })
);

export function flowInstanceReducer(state: FlowInstanceState, action: Action) {
  return __flowInstanceReducer(state, action);
}
