import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common'

export enum TemplateTelemetryEventType {
    VIEW = 'VIEW',
    INSTALL = 'INSTALL',
    ACTIVATE = 'ACTIVATE',
    DEACTIVATE = 'DEACTIVATE',
    EXPLORE_VIEW = 'EXPLORE_VIEW',
}

const ViewEvent = Type.Object({
    eventType: Type.Literal(TemplateTelemetryEventType.VIEW),
    templateId: Type.String(),
})

const InstallEvent = Type.Object({
    eventType: Type.Literal(TemplateTelemetryEventType.INSTALL),
    templateId: Type.String(),
    userId: Type.String(),
})

const ActivateEvent = Type.Object({
    eventType: Type.Literal(TemplateTelemetryEventType.ACTIVATE),
    templateId: Type.String(),
    flowId: Type.String(),
})

const DeactivateEvent = Type.Object({
    eventType: Type.Literal(TemplateTelemetryEventType.DEACTIVATE),
    templateId: Type.String(),
    flowId: Type.String(),
})

const ExploreViewEvent = Type.Object({
    eventType: Type.Literal(TemplateTelemetryEventType.EXPLORE_VIEW),
    userId: Type.Optional(Type.String()),
})

export const TemplateTelemetryEvent = DiscriminatedUnion('eventType', [
    InstallEvent,
    ActivateEvent,
    DeactivateEvent,
    ViewEvent,
    ExploreViewEvent,
])
export type TemplateTelemetryEvent = Static<typeof TemplateTelemetryEvent>

