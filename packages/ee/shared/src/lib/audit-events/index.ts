import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema, FlowOperationRequest, FlowOperationType } from "@activepieces/shared";
export const ListAuditEventsRequest = Type.Object({
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
})

export type ListAuditEventsRequest = Static<typeof ListAuditEventsRequest>;

export enum ApplicationEventName {
    CREATED_FLOW = 'CREATED_FLOW',
    DELETED_FLOW = 'DELETED_FLOW',
    CREATED_FOLDER = 'CREATED_FOLDER',
    UPDATED_FOLDER = 'UPDATED_FOLDER',
    DELETED_FOLDER = 'DELETED_FOLDER',
    UPDATED_FLOW = 'UPDATED_FLOW',
    UPSERTED_CONNECTION = 'UPSERTED_CONNECTION',
    DELETED_CONNECTION = 'DELETED_CONNECTION',
    SIGNED_UP_USING_EMAIL = 'SIGNED_UP_USING_EMAIL',
    SIGNED_UP_USING_SSO = 'SIGNED_UP_USING_SSO',
    SIGNED_UP_USING_MANAGED_AUTH = 'SIGNED_UP_USING_MANAGED_AUTH',
    SIGNED_IN = 'SIGNED_IN',
    RESET_PASSWORD = 'RESET_PASSWORD',
    VERIFIED_EMAIL = 'VERIFIED_EMAIL',
    CREATED_SIGNING_KEY = 'CREATED_SIGNING_KEY',
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
    action: Type.Union([
        Type.Literal(ApplicationEventName.CREATED_FLOW),
        Type.Literal(ApplicationEventName.DELETED_FLOW),
    ]),
    data: Type.Object({
        flowId: Type.String(),
        flowName: Type.String(),
    }),
})

export type FlowEvent = Static<typeof FlowEvent>

export const UpdatedFlowEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Literal(ApplicationEventName.UPDATED_FLOW),
    data: Type.Object({
        flowId: Type.String(),
        flowName: Type.String(),
        request: FlowOperationRequest
    }),
})

export type UpdatedFlowEvent = Static<typeof UpdatedFlowEvent>

export const AuthenticationEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([Type.Literal(ApplicationEventName.SIGNED_IN), Type.Literal(ApplicationEventName.RESET_PASSWORD), Type.Literal(ApplicationEventName.VERIFIED_EMAIL)]),
    data: Type.Object({}),
})

export type AuthenticationEvent = Static<typeof AuthenticationEvent>

export const SignUpEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([
        Type.Literal(ApplicationEventName.SIGNED_UP_USING_MANAGED_AUTH),
        Type.Literal(ApplicationEventName.SIGNED_UP_USING_EMAIL),
        Type.Literal(ApplicationEventName.SIGNED_UP_USING_SSO)]),
    data: Type.Object({
        createdUser: Type.Object({
            id: Type.String(),
            email: Type.String(),
        }),
    }),
})
export type SignUpEvent = Static<typeof SignUpEvent>

export const SigningKeyEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([
        Type.Literal(ApplicationEventName.CREATED_SIGNING_KEY),
    ]),
    data: Type.Object({
        signingKeyId: Type.String(),
        signingKeyName: Type.String(),
    }),
})

export type SigningKeyEvent = Static<typeof SigningKeyEvent>

export const ApplicationEvent = Type.Union([
    ConnectionEvent,
    FlowEvent,
    AuthenticationEvent,
    FolderEvent,
    UpdatedFlowEvent,
    SignUpEvent,
    SigningKeyEvent,
])

export type ApplicationEvent = Static<typeof ApplicationEvent>


export function summarizeApplicationEvent(event: ApplicationEvent) {
    switch (event.action) {
        case ApplicationEventName.UPDATED_FLOW: {
            return convertUpdateActionToDetails(event);
        }
        case ApplicationEventName.CREATED_FLOW:
            return `${event.data.flowName} is created`;
        case ApplicationEventName.DELETED_FLOW:
            return `${event.data.flowName} is deleted`;
        case ApplicationEventName.CREATED_FOLDER:
            return `${event.data.folderName} is created`;
        case ApplicationEventName.UPDATED_FOLDER:
            return `${event.data.folderName} is updated`;
        case ApplicationEventName.DELETED_FOLDER:
            return `${event.data.folderName} is deleted`;
        case ApplicationEventName.UPSERTED_CONNECTION:
            return `${event.data.connectionName} is updated`;
        case ApplicationEventName.DELETED_CONNECTION:
            return `${event.data.connectionName} is deleted`;
        case ApplicationEventName.SIGNED_IN:
            return `User ${event.userEmail} signed in`;
        case ApplicationEventName.RESET_PASSWORD:
            return `User ${event.userEmail} reset password`;
        case ApplicationEventName.VERIFIED_EMAIL:
            return `User ${event.userEmail} verified email`;
        case ApplicationEventName.SIGNED_UP_USING_EMAIL:
            return `User ${event.data.createdUser.email} signed up using email`;
        case ApplicationEventName.SIGNED_UP_USING_SSO:
            return `User ${event.data.createdUser.email} signed up using SSO`;
        case ApplicationEventName.SIGNED_UP_USING_MANAGED_AUTH:
            return `User ${event.data.createdUser.email} signed up using managed auth`;
        case ApplicationEventName.CREATED_SIGNING_KEY:
            return `${event.data.signingKeyName} is created`;
    }
}

function convertUpdateActionToDetails(event: UpdatedFlowEvent) {
    switch (event.data.request.type) {
        case FlowOperationType.ADD_ACTION:
            return `Added action "${event.data.request.request.action.displayName}" to "${event.data.flowName}" Flow.`;
        case FlowOperationType.UPDATE_ACTION:
            return `Updated action "${event.data.request.request.displayName}" in "${event.data.flowName}" Flow.`;
        case FlowOperationType.DELETE_ACTION:
            return `Deleted action "${event.data.request.request.name}" from "${event.data.flowName}" Flow.`;
        case FlowOperationType.CHANGE_NAME:
            return `Renamed flow "${event.data.flowName}" to "${event.data.request.request.displayName}".`;
        case FlowOperationType.LOCK_AND_PUBLISH:
            return `Locked and published flow "${event.data.flowName}" Flow.`;
        case FlowOperationType.USE_AS_DRAFT:
            return `Unlocked and unpublished flow "${event.data.flowName}" Flow.`;
        case FlowOperationType.MOVE_ACTION:
            return `Moved action "${event.data.request.request.name}" to after "${event.data.request.request.newParentStep}".`;
        case FlowOperationType.LOCK_FLOW:
            return `Locked flow "${event.data.flowName}" Flow.`;
        case FlowOperationType.CHANGE_STATUS:
            return `Changed status of flow "${event.data.flowName}" Flow to "${event.data.request.request.status}".`;
        case FlowOperationType.DUPLICATE_ACTION:
            return `Duplicated action "${event.data.request.request.stepName}" in "${event.data.flowName}" Flow.`;
        case FlowOperationType.IMPORT_FLOW:
            return `Imported flow in "${event.data.request.request.displayName}" Flow.`;
        case FlowOperationType.UPDATE_TRIGGER:
            return `Updated trigger in "${event.data.flowName}" Flow to "${event.data.request.request.displayName}".`;
        case FlowOperationType.CHANGE_FOLDER:
            return `Moved flow "${event.data.flowName}" to folder id ${event.data.request.request.folderId}.`;
    }


}
