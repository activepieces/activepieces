import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'
import { ApplicationEventName } from '../audit-events/index'
import { EventDestinationScope } from './dto'

const EventDestinationBase = {
    ...BaseModelSchema,
    platformId: z.string(),
    events: z.array(z.nativeEnum(ApplicationEventName)),
    url: z.string().url(),
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
