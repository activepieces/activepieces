import { z } from 'zod'
import { formErrors } from '../../form-errors'
import { ApplicationEventName } from '../audit-events'

const HEADER_NAME_PATTERN = /^[A-Za-z0-9!#$%&'*+\-.^_`|~]+$/

const HEADER_VALUE_PATTERN = /^[\t\x20-\x7e\x80-\xff]*$/

const DELIVERY_OWNED_HEADER_NAMES: ReadonlySet<string> = new Set([
    'content-type',
    'content-length',
    'content-encoding',
    'transfer-encoding',
    'host',
    'connection',
])

const HeaderName = z.string()
    .regex(HEADER_NAME_PATTERN, formErrors.invalidHeaderName)
    .refine((name) => !DELIVERY_OWNED_HEADER_NAMES.has(name.toLowerCase()), formErrors.reservedHeaderName)

const HeaderValue = z.string().regex(HEADER_VALUE_PATTERN, formErrors.invalidHeaderValue)

const hasUniqueHeaderNames = (headers: Record<string, unknown>): boolean => {
    const names = Object.keys(headers).map((name) => name.toLowerCase())
    return new Set(names).size === names.length
}

export enum EventDestinationScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export enum EventDestinationFormat {
    RAW = 'RAW',
    OTLP_JSON = 'OTLP_JSON',
    OTLP_PROTOBUF = 'OTLP_PROTOBUF',
}

export enum EventDestinationTestError {
    BLOCKED = 'BLOCKED',
    TIMEOUT = 'TIMEOUT',
    TLS = 'TLS',
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    HANDLER_FLOW_FAILED = 'HANDLER_FLOW_FAILED',
}

export const EventDestinationHeaders = z.record(HeaderName, HeaderValue)
    .refine(hasUniqueHeaderNames, formErrors.duplicateHeaderName)

export type EventDestinationHeaders = z.infer<typeof EventDestinationHeaders>

export const EventDestinationHeadersRequest = z.record(HeaderName, HeaderValue.nullable())
    .refine(hasUniqueHeaderNames, formErrors.duplicateHeaderName)

export type EventDestinationHeadersRequest = z.infer<typeof EventDestinationHeadersRequest>

export const ListPlatformEventDestinationsRequestBody = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
})

export type ListPlatformEventDestinationsRequestBody = z.infer<typeof ListPlatformEventDestinationsRequestBody>

export const CreatePlatformEventDestinationRequestBody = z.object({
    events: z.array(z.enum(ApplicationEventName)),
    url: z.url(),
    enabled: z.boolean().optional(),
    headers: EventDestinationHeadersRequest.nullish(),
    format: z.enum(EventDestinationFormat).optional(),
})

export type CreatePlatformEventDestinationRequestBody = z.infer<typeof CreatePlatformEventDestinationRequestBody>

export const UpdatePlatformEventDestinationRequestBody = CreatePlatformEventDestinationRequestBody.partial()

export type UpdatePlatformEventDestinationRequestBody = z.infer<typeof UpdatePlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationRequestBody = z.object({
    url: z.url(),
    event: z.enum(ApplicationEventName).optional(),
    headers: EventDestinationHeaders.nullish(),
    format: z.enum(EventDestinationFormat).optional(),
})

export type TestPlatformEventDestinationRequestBody = z.infer<typeof TestPlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationResponse = z.object({
    renderedBody: z.unknown(),
    status: z.number().optional(),
    durationMs: z.number(),
    errorCode: z.enum(EventDestinationTestError).optional(),
})

export type TestPlatformEventDestinationResponse = z.infer<typeof TestPlatformEventDestinationResponse>
