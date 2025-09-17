import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common'


export enum TriggerStrategy {
    POLLING = 'POLLING',
    WEBHOOK = 'WEBHOOK',
    APP_WEBHOOK = 'APP_WEBHOOK',
}

export enum WebhookHandshakeStrategy {
    NONE = 'NONE',
    HEADER_PRESENT = 'HEADER_PRESENT',
    QUERY_PRESENT = 'QUERY_PRESENT',
    BODY_PARAM_PRESENT = 'BODY_PARAM_PRESENT',
}

export enum TriggerSourceScheduleType {
    CRON_EXPRESSION = 'CRON_EXPRESSION',
}

export const WebhookHandshakeConfiguration = Type.Object({
    strategy: Type.Enum(WebhookHandshakeStrategy),
    paramName: Type.Optional(Type.String()),
})
export type WebhookHandshakeConfiguration = Static<typeof WebhookHandshakeConfiguration>
  
export const ScheduleOptions = Type.Object({
    type: Type.Enum(TriggerSourceScheduleType),
    cronExpression: Type.String(),
    timezone: Type.String(),
})
export type ScheduleOptions = Static<typeof ScheduleOptions>

export const TriggerSource = Type.Object({
    ...BaseModelSchema,
    type: Type.Enum(TriggerStrategy),
    projectId: Type.String(),
    flowId: Type.String(),
    triggerName: Type.String(),
    schedule: Nullable(ScheduleOptions),
    flowVersionId: Type.String(),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    deleted: Nullable(Type.String()),
    simulate: Type.Boolean(),
})

export type TriggerSource = Static<typeof TriggerSource>