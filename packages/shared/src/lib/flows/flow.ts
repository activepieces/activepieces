import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Metadata } from '../common/metadata'
import { FlowVersion } from './flow-version'

export type FlowId = ApId

export enum ScheduleType {
    CRON_EXPRESSION = 'CRON_EXPRESSION',
}

export enum FlowStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}



export enum WebhookHandshakeStrategy {
    NONE = 'NONE',
    HEADER_PRESENT = 'HEADER_PRESENT',
    QUERY_PRESENT = 'QUERY_PRESENT',
    BODY_PARAM_PRESENT = 'BODY_PARAM_PRESENT',
}
  
export const WebhookHandshakeConfiguration = Type.Object({
    strategy: Type.Enum(WebhookHandshakeStrategy),
    paramName: Type.Optional(Type.String()),
})
export type WebhookHandshakeConfiguration = Static<typeof WebhookHandshakeConfiguration>
  

export const FlowScheduleOptions = Type.Object({
    type: Type.Literal(ScheduleType.CRON_EXPRESSION),
    cronExpression: Type.String(),
    timezone: Type.String(),
    failureCount: Type.Optional(Type.Number()),
})

export type FlowScheduleOptions = Static<typeof FlowScheduleOptions>

export const Flow = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    externalId: Type.String(),
    folderId: Nullable(Type.String()),
    status: Type.Enum(FlowStatus),
    schedule: Nullable(FlowScheduleOptions),
    handshakeConfiguration: Nullable(WebhookHandshakeConfiguration),
    publishedVersionId: Nullable(Type.String()),
    metadata: Nullable(Metadata),
})

export type Flow = Static<typeof Flow>
export const PopulatedFlow = Type.Composite([
    Flow,
    Type.Object({
        version: FlowVersion,
    }),
])

export type PopulatedFlow = Static<typeof PopulatedFlow>
