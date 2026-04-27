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
    RESOURCE_LOCKED = 'RESOURCE_LOCKED',
    RESOURCE_UNLOCKED = 'RESOURCE_UNLOCKED',
    PRESENCE_UPDATED = 'PRESENCE_UPDATED',
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
    LOCK_RESOURCE = 'LOCK_RESOURCE',
    UNLOCK_RESOURCE = 'UNLOCK_RESOURCE',
    JOIN_PRESENCE = 'JOIN_PRESENCE',
    LEAVE_PRESENCE = 'LEAVE_PRESENCE',
}

export const BadgeAwarded = z.object({
    badge: z.string(),
    userId: z.string(),
})

export const LockResourceRequest = z.object({
    resourceId: z.string(),
    force: z.boolean().optional(),
})

export const LockResourceResponse = z.object({
    acquired: z.boolean(),
    lock: z.object({
        userId: z.string(),
        userDisplayName: z.string(),
    }).nullable(),
})

export const ResourceLockedEvent = z.object({
    resourceId: z.string(),
    userId: z.string(),
    userDisplayName: z.string(),
})

export const ResourceUnlockedEvent = z.object({
    resourceId: z.string(),
})

export const PresenceRequest = z.object({
    resourceId: z.string(),
})

export const PresenceUser = z.object({
    userId: z.string(),
    userDisplayName: z.string(),
    userEmail: z.string(),
    userImageUrl: z.string().nullable(),
})

export const PresenceUpdatedEvent = z.object({
    resourceId: z.string(),
    users: z.array(PresenceUser),
})

export type BadgeAwarded = z.infer<typeof BadgeAwarded>
export type LockResourceRequest = z.infer<typeof LockResourceRequest>
export type LockResourceResponse = z.infer<typeof LockResourceResponse>
export type ResourceLockedEvent = z.infer<typeof ResourceLockedEvent>
export type ResourceUnlockedEvent = z.infer<typeof ResourceUnlockedEvent>
export type EmitTestStepProgressRequest = StepRunResponse & { projectId: string }
export type PresenceRequest = z.infer<typeof PresenceRequest>
export type PresenceUser = z.infer<typeof PresenceUser>
export type PresenceUpdatedEvent = z.infer<typeof PresenceUpdatedEvent>
