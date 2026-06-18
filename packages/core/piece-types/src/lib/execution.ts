import { z } from 'zod'

export enum ExecutionType {
    BEGIN = 'BEGIN',
    RESUME = 'RESUME',
}

export enum PauseType {
    DELAY = 'DELAY',
    WEBHOOK = 'WEBHOOK',
}

export enum StreamStepProgress {
    WEBSOCKET = 'WEBSOCKET',
    NONE = 'NONE',
}

export const RespondResponse = z.object({
    status: z.number().optional(),
    body: z.unknown().optional(),
    headers: z.record(z.string(), z.string()).optional(),
})
export type RespondResponse = z.infer<typeof RespondResponse>

export const DelayPauseMetadata = z.object({
    type: z.literal(PauseType.DELAY),
    resumeDateTime: z.string(),
    requestIdToReply: z.string().optional(),
    handlerId: z.string().optional(),
    streamStepProgress: z.nativeEnum(StreamStepProgress).optional(),
})
export type DelayPauseMetadata = z.infer<typeof DelayPauseMetadata>

export const WebhookPauseMetadata = z.object({
    type: z.literal(PauseType.WEBHOOK),
    requestId: z.string(),
    requestIdToReply: z.string().optional(),
    response: RespondResponse,
    handlerId: z.string().optional(),
    streamStepProgress: z.nativeEnum(StreamStepProgress).optional(),
})
export type WebhookPauseMetadata = z.infer<typeof WebhookPauseMetadata>

export const PauseMetadata = z.union([DelayPauseMetadata, WebhookPauseMetadata])
export type PauseMetadata = z.infer<typeof PauseMetadata>
