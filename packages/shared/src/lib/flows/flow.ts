import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { FlowVersion } from './flow-version'

export type FlowId = ApId

export enum ScheduleType {
    CRON_EXPRESSION = 'CRON_EXPRESSION',
}

export enum FlowStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const FlowScheduleOptions = Type.Object({
    type: Type.Literal(ScheduleType.CRON_EXPRESSION),
    cronExpression: Type.String(),
    timezone: Type.String(),
})

export type FlowScheduleOptions = Static<typeof FlowScheduleOptions>

export const Flow = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    folderId: Nullable(Type.String()),
    status: Type.Enum(FlowStatus),
    schedule: Nullable(FlowScheduleOptions),
    publishedVersionId: Nullable(Type.String()),
})

export type Flow = Static<typeof Flow>

export const PopulatedFlow = Type.Composite([
    Flow,
    Type.Object({
        version: FlowVersion,
    }),
])

export type PopulatedFlow = Static<typeof PopulatedFlow>
