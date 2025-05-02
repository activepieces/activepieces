import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { UserWithMetaInformation } from '../user'
import { Trigger } from './triggers/trigger'

export type FlowVersionId = ApId

export const LATEST_SCHEMA_VERSION = '1'

export enum FlowVersionState {
    LOCKED = 'LOCKED',
    DRAFT = 'DRAFT',
}

export const FlowVersion = Type.Object({
    ...BaseModelSchema,
    flowId: Type.String(),
    displayName: Type.String(),
    trigger: Trigger,
    updatedBy: Nullable(Type.String()),
    valid: Type.Boolean(),
    schemaVersion: Nullable(Type.String()),
    state: Type.Enum(FlowVersionState),
    connectionIds: Type.Array(Type.String()),
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
