import { createAction, props } from '@ngrx/store';
import { FlowInstance, FlowVersion } from '@activepieces/shared';

export enum FlowInstanceActionType {
  SET_INITIAL = '[FLOW_INSTANCE] SET_INITIAL',
  PUBLISH_FLOW = '[FLOW_INSTANCE] PUBLISH_FLOW',
  PUBLISH_FLOW_FAILED = '[FLOW_INSTANCE] PUBLISH_FLOW_FAILED',
  PUBLISH_FLOW_SUCCESS = '[FLOW_INSTANCE] PUBLISH_FLOW_SUCCESS',
  DISABLE_INSTANCE = '[FLOW_INSTANCE] DISABLE_INSTANCE',
  ENABLE_INSTANCE = `[FLOW_INSTANCE] ENABLE_INSTANCE`,
  UPDATE_INSTANCE_STATUS_SUCCESS = `[FLOW_INSTANCE] UPDATE_INSTANCE_STATUS_SUCCESS`,
}

const setInitial = createAction(
  FlowInstanceActionType.SET_INITIAL,
  props<{ instance: FlowInstance; publishedFlowVersion: FlowVersion }>()
);
const enableInstance = createAction(FlowInstanceActionType.ENABLE_INSTANCE);
const disableInstance = createAction(FlowInstanceActionType.DISABLE_INSTANCE);
const publish = createAction(FlowInstanceActionType.PUBLISH_FLOW);
const publishFailed = createAction(FlowInstanceActionType.PUBLISH_FLOW_FAILED);

const publishSuccess = createAction(
  FlowInstanceActionType.PUBLISH_FLOW_SUCCESS,
  props<{
    instance: FlowInstance;
    showSnackbar: boolean;
    publishedFlowVersion: FlowVersion;
  }>()
);
const updateInstanceStatusSuccess = createAction(
  FlowInstanceActionType.UPDATE_INSTANCE_STATUS_SUCCESS,
  props<{ instance: FlowInstance }>()
);

export const FlowInstanceActions = {
  setInitial,
  publish,
  publishSuccess,
  publishFailed,
  enableInstance,
  disableInstance,
  updateInstanceStatusSuccess,
};
