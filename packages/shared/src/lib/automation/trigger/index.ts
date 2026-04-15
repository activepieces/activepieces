import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'

export enum TriggerStrategy {
    POLLING = 'POLLING',
    WEBHOOK = 'WEBHOOK',
    APP_WEBHOOK = 'APP_WEBHOOK',
    MANUAL = 'MANUAL',
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

export const WebhookHandshakeConfiguration = z.object({
    strategy: z.nativeEnum(WebhookHandshakeStrategy),
    paramName: z.string().optional(),
})
export type WebhookHandshakeConfiguration = z.infer<typeof WebhookHandshakeConfiguration>

export const ScheduleOptions = z.object({
    type: z.nativeEnum(TriggerSourceScheduleType),
    cronExpression: z.string(),
    timezone: z.string(),
})
export type ScheduleOptions = z.infer<typeof ScheduleOptions>

export const TriggerSource = z.object({
    ...BaseModelSchema,
    type: z.nativeEnum(TriggerStrategy),
    projectId: z.string(),
    flowId: z.string(),
    triggerName: z.string(),
    schedule: Nullable(ScheduleOptions),
    flowVersionId: z.string(),
    pieceName: z.string(),
    pieceVersion: z.string(),
    deleted: Nullable(z.string()),
    simulate: z.boolean(),
})

export type TriggerSource = z.infer<typeof TriggerSource>
