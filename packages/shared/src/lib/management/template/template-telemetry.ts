import { z } from 'zod'

export enum TemplateTelemetryEventType {
    VIEW = 'VIEW',
    INSTALL = 'INSTALL',
    ACTIVATE = 'ACTIVATE',
    DEACTIVATE = 'DEACTIVATE',
    EXPLORE_VIEW = 'EXPLORE_VIEW',
}

const ViewEvent = z.object({
    eventType: z.literal(TemplateTelemetryEventType.VIEW),
    templateId: z.string(),
})

const InstallEvent = z.object({
    eventType: z.literal(TemplateTelemetryEventType.INSTALL),
    templateId: z.string(),
    userId: z.string(),
})

const ActivateEvent = z.object({
    eventType: z.literal(TemplateTelemetryEventType.ACTIVATE),
    templateId: z.string(),
    flowId: z.string(),
})

const DeactivateEvent = z.object({
    eventType: z.literal(TemplateTelemetryEventType.DEACTIVATE),
    templateId: z.string(),
    flowId: z.string(),
})

const ExploreViewEvent = z.object({
    eventType: z.literal(TemplateTelemetryEventType.EXPLORE_VIEW),
    userId: z.string().optional(),
})

export const TemplateTelemetryEvent = z.discriminatedUnion('eventType', [
    InstallEvent,
    ActivateEvent,
    DeactivateEvent,
    ViewEvent,
    ExploreViewEvent,
])
export type TemplateTelemetryEvent = z.infer<typeof TemplateTelemetryEvent>
