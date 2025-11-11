import { Static, Type } from '@sinclair/typebox'
import { StepRunResponse } from '../flows/sample-data'

export enum WebsocketClientEvent {
    TEST_FLOW_RUN_STARTED = 'TEST_FLOW_RUN_STARTED',
    TEST_STEP_FINISHED = 'TEST_STEP_FINISHED',
    TEST_STEP_PROGRESS = 'TEST_STEP_PROGRESS',
    REFRESH_PIECE = 'REFRESH_PIECE',
    FLOW_RUN_PROGRESS = 'FLOW_RUN_PROGRESS',
    TODO_CHANGED = 'TODO_CHANGED',
    TODO_ACTIVITY_CHANGED = 'TODO_ACTIVITY_CHANGED',
    TODO_ACTIVITY_CREATED = 'TODO_ACTIVITY_CREATED',
}

export const TodoChanged = Type.Object({
    todoId: Type.String(),
})

export type TodoChanged = Static<typeof TodoChanged>


export const TodoActivityChanged = Type.Object({
    activityId: Type.String(),  
    todoId: Type.String(),
    content: Type.String(),

})

export type TodoActivityChanged = Static<typeof TodoActivityChanged>

export const TodoActivityCreated = Type.Object({
    todoId: Type.String(),
})

export type TodoActivityCreated = Static<typeof TodoActivityCreated>

export type EmitTestStepProgressRequest = StepRunResponse & { projectId: string }

export enum WebsocketServerEvent {
    TEST_FLOW_RUN = 'TEST_FLOW_RUN',
    CONNECT = 'CONNECT',
    FETCH_WORKER_SETTINGS = 'FETCH_WORKER_SETTINGS',
    DISCONNECT = 'DISCONNECT',
    WORKER_HEALTHCHECK = 'WORKER_HEALTHCHECK',
    EMIT_TEST_STEP_PROGRESS = 'EMIT_TEST_STEP_PROGRESS',
    EMIT_TEST_STEP_FINISHED = 'EMIT_TEST_STEP_FINISHED',
}

export * from './socket-utils'
