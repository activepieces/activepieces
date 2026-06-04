import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { UserWithMetaInformation } from '../../core/user'
import { Note } from './note'
import { FlowTrigger } from './triggers/trigger'

export type FlowVersionId = ApId

export const LATEST_FLOW_SCHEMA_VERSION = '21'

export enum FlowVersionState {
    LOCKED = 'LOCKED',
    DRAFT = 'DRAFT',
}

export const FlowVersion = z.object({
    ...BaseModelSchema,
    flowId: z.string(),
    displayName: z.string(),
    trigger: FlowTrigger,
    updatedBy: Nullable(z.string()),
    valid: z.boolean(),
    schemaVersion: Nullable(z.string()),
    agentIds: z.array(z.string()),
    state: z.nativeEnum(FlowVersionState),
    connectionIds: z.array(z.string()),
    backupFiles: Nullable(z.record(z.string(), z.string())),
    notes: z.array(Note),
})

export type FlowVersion = z.infer<typeof FlowVersion>

export const FlowVersionMetadata = z.object({
    ...BaseModelSchema,
    flowId: z.string(),
    displayName: z.string(),
    valid: z.boolean(),
    state: z.nativeEnum(FlowVersionState),
    updatedBy: Nullable(z.string()),
    schemaVersion: Nullable(z.string()),
    updatedByUser: Nullable(UserWithMetaInformation),
})

export type FlowVersionMetadata = z.infer<typeof FlowVersionMetadata>

