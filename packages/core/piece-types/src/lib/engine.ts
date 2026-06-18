import * as z from "zod/mini";

export const TriggerPayload = z.object({
    body: z.unknown(),
    rawBody: z.optional(z.unknown()),
    headers: z.record(z.string(), z.string()),
    queryParams: z.record(z.string(), z.string()),
})

export type TriggerPayload<T = unknown> = {
    body: T
    rawBody?: unknown
    headers: Record<string, string>
    queryParams: Record<string, string>
}

export type EventPayload<B = unknown> = {
    body: B
    rawBody?: unknown
    method: string
    headers: Record<string, string>
    queryParams: Record<string, string>
}

export type ParseEventResponse = {
    event?: string
    identifierValue?: string
    reply?: {
        headers: Record<string, string>
        body: unknown
    }
}

export type ResumePayload = TriggerPayload
