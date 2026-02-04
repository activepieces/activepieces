import { Static, Type } from '@sinclair/typebox'
import { TriggerUpdateStatusErrorParams } from '../common/activepieces-error'
import { PopulatedFlow } from '../flows/flow'
import { StepRunResponse } from '../flows/sample-data'

export enum WebsocketClientEvent {
    TEST_FLOW_RUN_STARTED = 'TEST_FLOW_RUN_STARTED',
    MANUAL_TRIGGER_RUN_STARTED = 'MANUAL_TRIGGER_RUN_STARTED',
    TEST_STEP_FINISHED = 'TEST_STEP_FINISHED',
    TEST_STEP_PROGRESS = 'TEST_STEP_PROGRESS',
    REFRESH_PIECE = 'REFRESH_PIECE',
    FLOW_RUN_PROGRESS = 'FLOW_RUN_PROGRESS',
    BADGE_AWARDED = 'BADGE_AWARDED',
    FLOW_STATUS_UPDATED = 'FLOW_STATUS_UPDATED',
    UPDATE_RUN_PROGRESS = 'UPDATE_RUN_PROGRESS',
}

export type FlowStatusUpdatedResponse = {
    flow: PopulatedFlow
    error: TriggerUpdateStatusErrorParams | undefined
}

export const BadgeAwarded = Type.Object({
    badge: Type.String(),
    userId: Type.String(),
})

export type BadgeAwarded = Static<typeof BadgeAwarded>

export type EmitTestStepProgressRequest = StepRunResponse & { projectId: string }

export enum WebsocketServerEvent {
    TEST_FLOW_RUN = 'TEST_FLOW_RUN',
    CONNECT = 'CONNECT',
    FETCH_WORKER_SETTINGS = 'FETCH_WORKER_SETTINGS',
    DISCONNECT = 'DISCONNECT',
    WORKER_HEALTHCHECK = 'WORKER_HEALTHCHECK',
    EMIT_TEST_STEP_PROGRESS = 'EMIT_TEST_STEP_PROGRESS',
    EMIT_TEST_STEP_FINISHED = 'EMIT_TEST_STEP_FINISHED',
    UPDATE_RUN_PROGRESS = 'UPDATE_RUN_PROGRESS',
    MANUAL_TRIGGER_RUN_STARTED = 'MANUAL_TRIGGER_RUN_STARTED',
}

export * from './socket-utils'
