import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Trigger } from './triggers/trigger'
import { Static, Type } from '@sinclair/typebox'

export type FlowVersionId = ApId

export enum FlowVersionState {
    LOCKED = 'LOCKED',
    DRAFT = 'DRAFT',
}

export const FlowVersion = Type.Object({
    ...BaseModelSchema,
    flowId: Type.String(),
    displayName: Type.String(),
    trigger: Trigger,
    updatedBy: Type.String(),
    valid: Type.Boolean(),
    state: Type.Enum(FlowVersionState),
})

export type FlowVersion = Static<typeof FlowVersion>