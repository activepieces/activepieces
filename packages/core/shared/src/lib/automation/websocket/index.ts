import { FlowStatus, FlowVersion, StepRunResponse, UpdateStepProgressRequest } from '@activepieces/core-execution'
import { z } from 'zod'
import { Field } from '../tables/field'
import { PopulatedRecord } from '../tables/record'

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
    CHAT_MESSAGE_CHUNK = 'CHAT_MESSAGE_CHUNK',
    // Resource-delta events: a mutation to a resource is broadcast to the project
    // room so any open view can patch its state live (see the *Event schemas
    // below). Applied idempotently on the client. Tables emit per-record/field
    // deltas; flows emit a full-version snapshot per operation (FlowVersion is
    // small and a snapshot is naturally last-write-wins / self-reconciling).
    TABLE_RECORD_CREATED = 'TABLE_RECORD_CREATED',
    TABLE_RECORD_UPDATED = 'TABLE_RECORD_UPDATED',
    TABLE_RECORD_DELETED = 'TABLE_RECORD_DELETED',
    TABLE_FIELD_CREATED = 'TABLE_FIELD_CREATED',
    TABLE_FIELD_UPDATED = 'TABLE_FIELD_UPDATED',
    TABLE_FIELD_DELETED = 'TABLE_FIELD_DELETED',
    FLOW_VERSION_UPDATED = 'FLOW_VERSION_UPDATED',
    FLOW_UPDATED = 'FLOW_UPDATED',
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

export enum LockerKind {
    USER = 'USER',
    AI = 'AI',
}

export const LockResourceRequest = z.object({
    resourceId: z.string(),
    force: z.boolean().optional(),
    lockerKind: z.enum([LockerKind.USER, LockerKind.AI]).optional(),
    reason: z.string().optional(),
})

export const LockHolder = z.object({
    userId: z.string(),
    userDisplayName: z.string(),
    lockerKind: z.enum([LockerKind.USER, LockerKind.AI]).optional(),
    reason: z.string().optional(),
})

export const LockResourceResponse = z.object({
    acquired: z.boolean(),
    lock: LockHolder.nullable(),
})

export const ResourceLockedEvent = z.object({
    resourceId: z.string(),
    userId: z.string(),
    userDisplayName: z.string(),
    lockerKind: z.enum([LockerKind.USER, LockerKind.AI]).optional(),
    reason: z.string().optional(),
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

export const TableRecordCreatedEvent = z.object({
    tableId: z.string(),
    projectId: z.string(),
    record: PopulatedRecord,
})

export const TableRecordUpdatedEvent = z.object({
    tableId: z.string(),
    projectId: z.string(),
    record: PopulatedRecord,
})

export const TableRecordDeletedEvent = z.object({
    tableId: z.string(),
    projectId: z.string(),
    recordId: z.string(),
})

export const TableFieldCreatedEvent = z.object({
    tableId: z.string(),
    projectId: z.string(),
    field: Field,
})

export const TableFieldUpdatedEvent = z.object({
    tableId: z.string(),
    projectId: z.string(),
    field: Field,
})

export const TableFieldDeletedEvent = z.object({
    tableId: z.string(),
    projectId: z.string(),
    fieldId: z.string(),
})

export const FlowVersionUpdatedEvent = z.object({
    projectId: z.string(),
    flowId: z.string(),
    flowVersionId: z.string(),
    // The flow operation that produced this snapshot (informational; the client
    // uses it only to drive the change effect). Kept as a string so this schema
    // stays decoupled from FlowOperationType.
    operationType: z.string(),
    // Step name(s) the operation touched, so the open builder can highlight and
    // pan to where the change happened. Empty when not derivable.
    changedStepNames: z.array(z.string()),
    flowVersion: FlowVersion,
})

export const FlowEntityUpdatedEvent = z.object({
    projectId: z.string(),
    flowId: z.string(),
    status: z.enum([FlowStatus.ENABLED, FlowStatus.DISABLED]),
    publishedVersionId: z.string().nullable(),
    folderId: z.string().nullable(),
})

export type BadgeAwarded = z.infer<typeof BadgeAwarded>
export type LockResourceRequest = z.infer<typeof LockResourceRequest>
export type LockHolder = z.infer<typeof LockHolder>
export type LockResourceResponse = z.infer<typeof LockResourceResponse>
export type ResourceLockedEvent = z.infer<typeof ResourceLockedEvent>
export type ResourceUnlockedEvent = z.infer<typeof ResourceUnlockedEvent>
export type EmitTestStepProgressRequest = StepRunResponse & { projectId: string }
export type TestStepProgressEvent = UpdateStepProgressRequest | EmitTestStepProgressRequest
export type PresenceRequest = z.infer<typeof PresenceRequest>
export type PresenceUser = z.infer<typeof PresenceUser>
export type PresenceUpdatedEvent = z.infer<typeof PresenceUpdatedEvent>
export type TableRecordCreatedEvent = z.infer<typeof TableRecordCreatedEvent>
export type TableRecordUpdatedEvent = z.infer<typeof TableRecordUpdatedEvent>
export type TableRecordDeletedEvent = z.infer<typeof TableRecordDeletedEvent>
export type TableFieldCreatedEvent = z.infer<typeof TableFieldCreatedEvent>
export type TableFieldUpdatedEvent = z.infer<typeof TableFieldUpdatedEvent>
export type TableFieldDeletedEvent = z.infer<typeof TableFieldDeletedEvent>
export type FlowVersionUpdatedEvent = z.infer<typeof FlowVersionUpdatedEvent>
export type FlowEntityUpdatedEvent = z.infer<typeof FlowEntityUpdatedEvent>
