import { z } from 'zod'

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

export const WebhookHandshakeConfiguration = z.object({
    strategy: z.nativeEnum(WebhookHandshakeStrategy),
    paramName: z.string().optional(),
})
export type WebhookHandshakeConfiguration = z.infer<typeof WebhookHandshakeConfiguration>

export enum TriggerTestStrategy {
    SIMULATION = 'SIMULATION',
    TEST_FUNCTION = 'TEST_FUNCTION',
}

export const AUTHENTICATION_PROPERTY_NAME = 'auth'
