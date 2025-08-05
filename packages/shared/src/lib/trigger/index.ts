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
  
export const WebhookHandshakeConfiguration = Type.Object({
    strategy: Type.Enum(WebhookHandshakeStrategy),
    paramName: Type.Optional(Type.String()),
})
export type WebhookHandshakeConfiguration = Static<typeof WebhookHandshakeConfiguration>
  
export const ScheduleOptions = Type.Object({
    cronExpression: Type.String(),
    timezone: Type.String(),
})
export type ScheduleOptions = Static<typeof ScheduleOptions>

export const Trigger = Type.Object({
    ...BaseModelSchema,
    type: Type.Enum(TriggerStrategy),
    projectId: Type.String(),
    flowId: Type.String(),
    handshakeConfiguration: Nullable(WebhookHandshakeConfiguration),
    schedule: Nullable(ScheduleOptions),
    flowVersionId: Type.String(),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    simulate: Type.Boolean(),
})

export type Trigger = Static<typeof Trigger>