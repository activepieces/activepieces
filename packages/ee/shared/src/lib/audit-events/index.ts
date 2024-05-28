import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema, FlowOperationRequest, FlowOperationType } from "@activepieces/shared";
export const ListAuditEventsRequest = Type.Object({
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
})

export type ListAuditEventsRequest = Static<typeof ListAuditEventsRequest>;

export enum ApplicationEventName {
    FLOW_CREATED = 'flow.created',
    FLOW_DELETED = 'flow.deleted',
    FLOW_UPDATED = 'flow.updated',
    FOLDER_CREATED = 'folder.created',
    FOLDER_UPDATED = 'folder.updated',
    FOLDER_DELETED = 'folder.deleted',
    CONNECTION_UPSERTED = 'connection.upserted',
    CONNECTION_DELETED = 'connection.deleted',
    USER_SIGNED_UP_USING_EMAIL = 'user.signed.up.email',
    USER_SIGNED_UP_USING_SSO = 'user.signed.up.sso',
    USER_SIGNED_UP_USING_MANAGED_AUTH = 'user.signed.up.managed.auth',
    USER_SIGNED_IN = 'user.signed.in',
    USER_PASSWORD_RESET = 'user.password.reset',
    USER_EMAIL_VERIFIED = 'user.email.verified',
    SIGNING_KEY_CREATED = 'signing.key.created',
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
    action: Type.Union([Type.Literal(ApplicationEventName.CONNECTION_DELETED), Type.Literal(ApplicationEventName.CONNECTION_UPSERTED)]),
    data: Type.Object({
        connectionId: Type.String(),
        connectionName: Type.String(),
    }),
})

export type ConnectionEvent = Static<typeof ConnectionEvent>


export const FolderEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([Type.Literal(ApplicationEventName.FOLDER_UPDATED), Type.Literal(ApplicationEventName.FOLDER_CREATED), Type.Literal(ApplicationEventName.FOLDER_DELETED)]),
    data: Type.Object({
        folderId: Type.String(),
        folderName: Type.String(),
    }),
})

export type FolderEvent = Static<typeof FolderEvent>


export const FlowCreatedEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Literal(ApplicationEventName.FLOW_CREATED),
    data: Type.Object({
        flowId: Type.String(),
        flowName: Type.String(),
    }),
})

export const FlowEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([
        Type.Literal(ApplicationEventName.FLOW_CREATED),
        Type.Literal(ApplicationEventName.FLOW_DELETED),
    ]),
    data: Type.Object({
        flowId: Type.String(),
        flowName: Type.String(),
    }),
})

export type FlowEvent = Static<typeof FlowEvent>

export const UpdatedFlowEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Literal(ApplicationEventName.FLOW_UPDATED),
    data: Type.Object({
        flowId: Type.String(),
        flowName: Type.String(),
        request: FlowOperationRequest
    }),
})

export type UpdatedFlowEvent = Static<typeof UpdatedFlowEvent>

export const AuthenticationEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([Type.Literal(ApplicationEventName.USER_SIGNED_IN), Type.Literal(ApplicationEventName.USER_PASSWORD_RESET), Type.Literal(ApplicationEventName.USER_EMAIL_VERIFIED)]),
    data: Type.Object({}),
})

export type AuthenticationEvent = Static<typeof AuthenticationEvent>

export const SignUpEvent = Type.Object({
    ...BaseAuditEventProps,
    action: Type.Union([
        Type.Literal(ApplicationEventName.USER_SIGNED_UP_USING_MANAGED_AUTH),
        Type.Literal(ApplicationEventName.USER_SIGNED_UP_USING_EMAIL),
        Type.Literal(ApplicationEventName.USER_SIGNED_UP_USING_SSO)]),
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
        Type.Literal(ApplicationEventName.SIGNING_KEY_CREATED),
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
        case ApplicationEventName.FLOW_UPDATED: {
            return convertUpdateActionToDetails(event);
        }
        case ApplicationEventName.FLOW_CREATED:
            return `${event.data.flowName} is created`;
        case ApplicationEventName.FLOW_DELETED:
            return `${event.data.flowName} is deleted`;
        case ApplicationEventName.FOLDER_CREATED:
            return `${event.data.folderName} is created`;
        case ApplicationEventName.FOLDER_UPDATED:
            return `${event.data.folderName} is updated`;
        case ApplicationEventName.FOLDER_DELETED:
            return `${event.data.folderName} is deleted`;
        case ApplicationEventName.CONNECTION_UPSERTED:
            return `${event.data.connectionName} is updated`;
        case ApplicationEventName.CONNECTION_DELETED:
            return `${event.data.connectionName} is deleted`;
        case ApplicationEventName.USER_SIGNED_IN:
            return `User ${event.userEmail} signed in`;
        case ApplicationEventName.USER_PASSWORD_RESET:
            return `User ${event.userEmail} reset password`;
        case ApplicationEventName.USER_EMAIL_VERIFIED:
            return `User ${event.userEmail} verified email`;
        case ApplicationEventName.USER_SIGNED_UP_USING_EMAIL:
            return `User ${event.data.createdUser.email} signed up using email`;
        case ApplicationEventName.USER_SIGNED_UP_USING_SSO:
            return `User ${event.data.createdUser.email} signed up using SSO`;
        case ApplicationEventName.USER_SIGNED_UP_USING_MANAGED_AUTH:
            return `User ${event.data.createdUser.email} signed up using managed auth`;
        case ApplicationEventName.SIGNING_KEY_CREATED:
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
