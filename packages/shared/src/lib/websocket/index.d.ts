import { Static } from '@sinclair/typebox';
import { TriggerUpdateStatusErrorParams } from '../common/activepieces-error';
import { PopulatedFlow } from '../flows/flow';
import { StepRunResponse } from '../flows/sample-data';
export declare enum WebsocketClientEvent {
    TEST_FLOW_RUN_STARTED = "TEST_FLOW_RUN_STARTED",
    TEST_STEP_FINISHED = "TEST_STEP_FINISHED",
    TEST_STEP_PROGRESS = "TEST_STEP_PROGRESS",
    REFRESH_PIECE = "REFRESH_PIECE",
    FLOW_RUN_PROGRESS = "FLOW_RUN_PROGRESS",
    TODO_CHANGED = "TODO_CHANGED",
    TODO_ACTIVITY_CHANGED = "TODO_ACTIVITY_CHANGED",
    TODO_ACTIVITY_CREATED = "TODO_ACTIVITY_CREATED",
    FLOW_STATUS_UPDATED = "FLOW_STATUS_UPDATED"
}
export type FlowStatusUpdatedResponse = {
    flow: PopulatedFlow;
    error: TriggerUpdateStatusErrorParams | undefined;
};
export declare const TodoChanged: import("@sinclair/typebox").TObject<{
    todoId: import("@sinclair/typebox").TString;
}>;
export type TodoChanged = Static<typeof TodoChanged>;
export declare const TodoActivityChanged: import("@sinclair/typebox").TObject<{
    activityId: import("@sinclair/typebox").TString;
    todoId: import("@sinclair/typebox").TString;
    content: import("@sinclair/typebox").TString;
}>;
export type TodoActivityChanged = Static<typeof TodoActivityChanged>;
export declare const TodoActivityCreated: import("@sinclair/typebox").TObject<{
    todoId: import("@sinclair/typebox").TString;
}>;
export type TodoActivityCreated = Static<typeof TodoActivityCreated>;
export type EmitTestStepProgressRequest = StepRunResponse & {
    projectId: string;
};
export declare enum WebsocketServerEvent {
    TEST_FLOW_RUN = "TEST_FLOW_RUN",
    CONNECT = "CONNECT",
    FETCH_WORKER_SETTINGS = "FETCH_WORKER_SETTINGS",
    DISCONNECT = "DISCONNECT",
    WORKER_HEALTHCHECK = "WORKER_HEALTHCHECK",
    EMIT_TEST_STEP_PROGRESS = "EMIT_TEST_STEP_PROGRESS",
    EMIT_TEST_STEP_FINISHED = "EMIT_TEST_STEP_FINISHED"
}
export * from './socket-utils';
