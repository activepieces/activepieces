import { z } from 'zod'

export enum ApplicationEventName {
    FLOW_CREATED = 'FLOW_CREATED',
    FLOW_UPDATED = 'FLOW_UPDATED',
    FLOW_DELETED = 'FLOW_DELETED',
    FLOW_PUBLISHED = 'FLOW_PUBLISHED',
    FLOW_ACTIVATED = 'FLOW_ACTIVATED',
    FLOW_DEACTIVATED = 'FLOW_DEACTIVATED',
    FLOW_RUN_STARTED = 'FLOW_RUN_STARTED',
    FLOW_RUN_FINISHED = 'FLOW_RUN_FINISHED',
    FLOW_RUN_RESUMED = 'FLOW_RUN_RESUMED',
    FLOW_RUN_RETRIED = 'FLOW_RUN_RETRIED',
    CONNECTION_UPSERTED = 'CONNECTION_UPSERTED',
    CONNECTION_DELETED = 'CONNECTION_DELETED',
    FOLDER_CREATED = 'FOLDER_CREATED',
    FOLDER_UPDATED = 'FOLDER_UPDATED',
    FOLDER_DELETED = 'FOLDER_DELETED',
    USER_SIGNED_UP = 'USER_SIGNED_UP',
    USER_SIGNED_IN = 'USER_SIGNED_IN',
    USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
    USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
    USER_INVITATION_CREATED = 'USER_INVITATION_CREATED',
    USER_INVITATION_ACCEPTED = 'USER_INVITATION_ACCEPTED',
    VARIABLE_UPSERTED = 'VARIABLE_UPSERTED',
    VARIABLE_VALUE_REVEALED = 'VARIABLE_VALUE_REVEALED',
    VARIABLE_DELETED = 'VARIABLE_DELETED',
}

export const ApplicationEvent = z.object({
    id: z.string(),
    created: z.string(),
    updated: z.string(),
    platformId: z.string(),
    projectId: z.string().optional(),
    userId: z.string().optional(),
    userEmail: z.string().optional(),
    projectDisplayName: z.string().optional(),
    ip: z.string().optional(),
    action: z.nativeEnum(ApplicationEventName),
    data: z.record(z.string(), z.unknown()),
})
export type ApplicationEvent = z.infer<typeof ApplicationEvent>

export type FlowRunEvent = Omit<ApplicationEvent, 'data'> & {
    data: { flowRun: Record<string, unknown> } & Record<string, unknown>
}

export type FlowUpdatedEvent = Omit<ApplicationEvent, 'data'> & {
    data: { request: Record<string, unknown>; flowVersion: Record<string, unknown> } & Record<string, unknown>
}

export type ListAuditEventsRequest = {
    platformId: string
    cursor?: string
    limit?: number
    userId?: string
    projectId?: string
    action?: ApplicationEventName[]
    createdAfter?: string
    createdBefore?: string
}

export function buildMockEvent({ event, platformId, projectId }: { event: ApplicationEventName; platformId: string; projectId?: string }): ApplicationEvent {
    return {
        id: 'mock-id',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId,
        projectId,
        action: event,
        data: {},
    }
}
