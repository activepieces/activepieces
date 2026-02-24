import { BaseModelSchema, DiscriminatedUnion } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ApplicationEventName } from '../audit-events/index'
import { EventDestinationScope } from './dto'

const EventDestinationBase = {
    ...BaseModelSchema,
    platformId: Type.String(),
    events: Type.Array(Type.Enum(ApplicationEventName)),
    url: Type.String({ format: 'uri' }),
}



const EventDestinationProjectScope = Type.Object({
    ...EventDestinationBase,
    scope: Type.Literal(EventDestinationScope.PROJECT),
    projectId: Type.String(),
})

export const EventDestinationPlatformScope = Type.Object({
    ...EventDestinationBase,
    scope: Type.Literal(EventDestinationScope.PLATFORM),
})

export const EventDestination = DiscriminatedUnion('scope', [
    EventDestinationPlatformScope,
    EventDestinationProjectScope,
])

export type EventDestination = Static<typeof EventDestination>

export * from './dto'
