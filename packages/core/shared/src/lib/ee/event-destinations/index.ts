import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { ApplicationEventName } from '../audit-events/index'
import { DestinationType, EventDestinationHeadersRequest, EventDestinationScope } from './dto'

const EventDestinationBase = {
    ...BaseModelSchema,
    platformId: z.string(),
    events: z.array(z.enum(ApplicationEventName)),
    url: z.url(),
    name: z.string().nullable(),
    type: z.enum(DestinationType),
    enabled: z.boolean(),
    headers: EventDestinationHeadersRequest.nullable(),
    mapper: z.unknown(),
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
