import { z } from 'zod'
import { StepRunResponse } from '../flows/sample-data'

export enum WebsocketClientEvent {
    TEST_FLOW_RUN_STARTED = 'TEST_FLOW_RUN_STARTED',
    MANUAL_TRIGGER_RUN_STARTED = 'MANUAL_TRIGGER_RUN_STARTED',
    TEST_STEP_FINISHED = 'TEST_STEP_FINISHED',
    TEST_STEP_PROGRESS = 'TEST_STEP_PROGRESS',
    REFRESH_PIECE = 'REFRESH_PIECE',
    FLOW_RUN_PROGRESS = 'FLOW_RUN_PROGRESS',
    BADGE_AWARDED = 'BADGE_AWARDED',
    UPDATE_RUN_PROGRESS = 'UPDATE_RUN_PROGRESS',
    FLOW_LOCKED = 'FLOW_LOCKED',
    FLOW_UNLOCKED = 'FLOW_UNLOCKED',
}

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
    LOCK_FLOW = 'LOCK_FLOW',
    UNLOCK_FLOW = 'UNLOCK_FLOW',
}

export const BadgeAwarded = z.object({
    badge: z.string(),
    userId: z.string(),
})

export const WebsocketLockFlowRequest = z.object({
    flowId: z.string(),
    force: z.boolean().optional(),
})

export const WebsocketLockFlowResponse = z.object({
    acquired: z.boolean(),
    lock: z.object({
        userId: z.string(),
        userDisplayName: z.string(),
    }).nullable(),
})

export const FlowLockedEvent = z.object({
    flowId: z.string(),
    userId: z.string(),
    userDisplayName: z.string(),
})

export const FlowUnlockedEvent = z.object({
    flowId: z.string(),
})

export type BadgeAwarded = z.infer<typeof BadgeAwarded>
export type WebsocketLockFlowRequest = z.infer<typeof WebsocketLockFlowRequest>
export type WebsocketLockFlowResponse = z.infer<typeof WebsocketLockFlowResponse>
export type FlowLockedEvent = z.infer<typeof FlowLockedEvent>
export type FlowUnlockedEvent = z.infer<typeof FlowUnlockedEvent>
export type EmitTestStepProgressRequest = StepRunResponse & { projectId: string }

