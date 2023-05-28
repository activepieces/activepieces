import { Action, createReducer, on } from '@ngrx/store';
import { FlowInstance, FlowVersion } from '@activepieces/shared';
import { FlowInstanceActions } from './flow-instance.action';

export type FlowInstanceState = {
  instance?: FlowInstance;
  publishedFlowVersion?: FlowVersion;
};

const initialState: FlowInstanceState = {};

const __flowInstanceReducer = createReducer(
  initialState,
  on(
    FlowInstanceActions.setInitial,
    (state, { instance, publishedFlowVersion }): FlowInstanceState => {
      return {
        instance: { ...instance },
        publishedFlowVersion: { ...publishedFlowVersion },
      };
    }
  ),
  on(
    FlowInstanceActions.publishSuccess,
    (state, { instance, publishedFlowVersion }): FlowInstanceState => {
      return {
        instance: {
          ...instance,
        },
        publishedFlowVersion: {
          ...publishedFlowVersion,
        },
      };
    }
  ),
  on(
    FlowInstanceActions.updateInstanceStatusSuccess,
    (state, { instance }): FlowInstanceState => {
      const clonedState = JSON.parse(JSON.stringify(state));
      return {
        ...clonedState,
        instance: {
          ...instance,
        },
      };
    }
  )
);

export function flowInstanceReducer(
  state: FlowInstanceState | undefined,
  action: Action
) {
  return __flowInstanceReducer(state, action);
}
