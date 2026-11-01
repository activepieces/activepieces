import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { ApplicationEventName } from '../audit-events/index'
import { EventDestinationFormat, EventDestinationHeadersRequest, EventDestinationScope } from './dto'

const EventDestinationBase = {
    ...BaseModelSchema,
    platformId: z.string(),
    events: z.array(z.enum(ApplicationEventName)),
    url: z.url(),
    enabled: z.boolean(),
    headers: EventDestinationHeadersRequest.nullable(),
    format: z.enum(EventDestinationFormat),
}

const EventDestinationProjectScope = z.object({
    ...EventDestinationBase,
    scope: z.literal(EventDestinationScope.PROJECT),
    projectId: z.string(),
})

export const EventDestinationPlatformScope = z.object({
    ...EventDestinationBase,
    scope: z.literal(EventDestinationScope.PLATFORM),
})

export const EventDestination = z.discriminatedUnion('scope', [
    EventDestinationPlatformScope,
    EventDestinationProjectScope,
])

export type EventDestination = z.infer<typeof EventDestination>

export * from './dto'
