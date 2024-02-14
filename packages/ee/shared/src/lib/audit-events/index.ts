import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";
export const ListAuditEventsRequest = Type.Object({
    limit: Type.Optional( Type.Number()),
    cursor: Type.Optional(Type.String()),
})

export type ListAuditEventsRequest = Static<typeof ListAuditEventsRequest>;

export enum ApplicationEventName {
    CREATED_FLOW = 'CREATED_FLOW',
    DELETED_FLOW = 'DELETED_FLOW',
    CREATED_FOLDER = 'CREATED_FOLDER',
    UPDATED_FOLDER = 'UPDATED_FOLDER',
    DELETED_FOLDER = 'DELETED_FOLDER',
    UPSERTED_CONNECTION = 'UPSERTED_CONNECTION',
    DELETED_CONNECTION = 'DELETED_CONNECTION',
    SIGNED_IN = 'SIGNED_IN',
    SIGNED_UP = 'SIGNED_UP',
    RESET_PASSWORD = 'RESET_PASSWORD',
    VERIFIED_EMAIL = 'VERIFIED_EMAIL',
}

const BaseAuditEventProps = {
    ...BaseModelSchema,
    platformId: Type.String(),
    projectId: Type.Optional(Type.String()),
    projectDisplayName: Type.Optional(Type.String()),
    ip: Type.Optional(Type.String()),
    userId: Type.String(),
    userEmail: Type.String(),
}

export const ConnectionEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([Type.Literal(ApplicationEventName.DELETED_CONNECTION), Type.Literal(ApplicationEventName.UPSERTED_CONNECTION)]),
    data: Type.Object({
        connectionId: Type.String(),
        connectionName: Type.String(),
    }),
})

export type ConnectionEvent = Static<typeof ConnectionEvent>


export const FolderEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([Type.Literal(ApplicationEventName.UPDATED_FOLDER), Type.Literal(ApplicationEventName.CREATED_FOLDER), Type.Literal(ApplicationEventName.DELETED_FOLDER)]),
    data: Type.Object({
        folderId: Type.String(),
        folderName: Type.String(),
    }),
})

export type FolderEvent = Static<typeof FolderEvent>


export const FlowEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([Type.Literal(ApplicationEventName.CREATED_FLOW), Type.Literal(ApplicationEventName.DELETED_FLOW)]),
    data: Type.Object({
        flowId: Type.String(),
        flowName: Type.String(),
    }),
})

export type FlowEvent = Static<typeof FlowEvent>

export const AuthenticationEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([Type.Literal(ApplicationEventName.SIGNED_UP), Type.Literal(ApplicationEventName.SIGNED_IN), Type.Literal(ApplicationEventName.RESET_PASSWORD), Type.Literal(ApplicationEventName.VERIFIED_EMAIL)]),
    data: Type.Object({}),
})

export type AuthenticationEvent = Static<typeof AuthenticationEvent>

export const ApplicationEvent = Type.Union([
    ConnectionEvent,
    FlowEvent,
    AuthenticationEvent,
    FolderEvent,
])

export type ApplicationEvent = Static<typeof ApplicationEvent>

