import * as z from "zod/mini";

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
    status: z.optional(z.number()),
    body: z.optional(z.unknown()),
    headers: z.optional(z.record(z.string(), z.string())),
})
export type RespondResponse = z.infer<typeof RespondResponse>

export const DelayPauseMetadata = z.object({
    type: z.literal(PauseType.DELAY),
    resumeDateTime: z.string(),
    requestIdToReply: z.optional(z.string()),
    handlerId: z.optional(z.string()),
    streamStepProgress: z.optional(z.enum(StreamStepProgress)),
})
export type DelayPauseMetadata = z.infer<typeof DelayPauseMetadata>

export const WebhookPauseMetadata = z.object({
    type: z.literal(PauseType.WEBHOOK),
    requestId: z.string(),
    requestIdToReply: z.optional(z.string()),
    response: RespondResponse,
    handlerId: z.optional(z.string()),
    streamStepProgress: z.optional(z.enum(StreamStepProgress)),
})
export type WebhookPauseMetadata = z.infer<typeof WebhookPauseMetadata>

export const PauseMetadata = z.union([DelayPauseMetadata, WebhookPauseMetadata])
export type PauseMetadata = z.infer<typeof PauseMetadata>
