import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { UserWithMetaInformation } from '../../core/user'
import { FlowGraph } from './graph/flow-graph'
import { Note } from './note'

export type FlowVersionId = ApId

export const LATEST_FLOW_SCHEMA_VERSION = '17'

export enum FlowVersionState {
    LOCKED = 'LOCKED',
    DRAFT = 'DRAFT',
}

export const FlowVersion = Type.Object({
    ...BaseModelSchema,
    flowId: Type.String(),
    displayName: Type.String(),
    graph: FlowGraph,
    updatedBy: Nullable(Type.String()),
    valid: Type.Boolean(),
    schemaVersion: Nullable(Type.String()),
    agentIds: Type.Array(Type.String()),
    state: Type.Enum(FlowVersionState),
    connectionIds: Type.Array(Type.String()),
    backupFiles: Nullable(Type.Record(Type.String(), Type.String())),
    notes: Type.Array(Note),
})

export type FlowVersion = Static<typeof FlowVersion>

export const FlowVersionMetadata = Type.Object({
    ...BaseModelSchema,
    flowId: Type.String(),
    displayName: Type.String(),
    valid: Type.Boolean(),
    state: Type.Enum(FlowVersionState),
    updatedBy: Nullable(Type.String()),
    schemaVersion: Nullable(Type.String()),
    updatedByUser: Nullable(UserWithMetaInformation),
})

export type FlowVersionMetadata = Static<typeof FlowVersionMetadata>
