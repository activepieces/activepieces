import { z } from 'zod'
import { Flow } from '../../automation/flows/flow'
import { FlowVersion } from '../../automation/flows/flow-version'
import { Folder } from '../../automation/flows/folders/folder'
import { FlowOperationRequest, FlowOperationType } from '../../automation/flows/operations'
import { BaseModelSchema, DateOrString, Nullable, OptionalArrayFromQuery } from '../../core/common/base-model'
import { UserWithMetaInformation } from '../../core/user/user'
import { ProjectRole } from '../../management/project-role/project-role'
import { SigningKey } from '../signing-key'
export const ListAuditEventsRequest = z.object({
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    action: OptionalArrayFromQuery(z.string()),
    projectId: OptionalArrayFromQuery(z.string()),
    userId: z.string().optional(),
    createdBefore: z.string().optional(),
    createdAfter: z.string().optional(),
})

export type ListAuditEventsRequest = z.infer<typeof ListAuditEventsRequest>

const UserMeta = UserWithMetaInformation.pick({ email: true, id: true, firstName: true, lastName: true })

export enum ApplicationEventName {
    FLOW_CREATED = 'flow.created',
    FLOW_DELETED = 'flow.deleted',
    FLOW_UPDATED = 'flow.updated',
    FLOW_PUBLISHED = 'flow.published',
    FLOW_ACTIVATED = 'flow.activated',
    FLOW_DEACTIVATED = 'flow.deactivated',
    FLOW_RUN_RESUMED = 'flow.run.resumed',
    FLOW_RUN_STARTED = 'flow.run.started',
    FLOW_RUN_FINISHED = 'flow.run.finished',
    FLOW_RUN_RETRIED = 'flow.run.retried',
    FOLDER_CREATED = 'folder.created',
    FOLDER_UPDATED = 'folder.updated',
    FOLDER_DELETED = 'folder.deleted',
    CONNECTION_UPSERTED = 'connection.upserted',
    CONNECTION_DELETED = 'connection.deleted',
    USER_SIGNED_UP = 'user.signed.up',
    USER_SIGNED_IN = 'user.signed.in',
    USER_PASSWORD_RESET = 'user.password.reset',
    USER_EMAIL_VERIFIED = 'user.email.verified',
    SIGNING_KEY_CREATED = 'signing.key.created',
    PROJECT_ROLE_CREATED = 'project.role.created',
    PROJECT_ROLE_DELETED = 'project.role.deleted',
    PROJECT_ROLE_UPDATED = 'project.role.updated',
    PROJECT_RELEASE_CREATED = 'project.release.created',
}

const BaseAuditEventProps = {
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: z.string().optional(),
    projectDisplayName: z.string().optional(),
    userId: z.string().optional(),
    userEmail: z.string().optional(),
    ip: z.string().optional(),
}

const ConnectionEventData = z.object({
    connection: z.object({
        displayName: z.string(),
        externalId: z.string(),
        pieceName: z.string(),
        status: z.string(),
        type: z.string(),
        id: z.string(),
        created: DateOrString,
        updated: DateOrString,
    }),
    project: z.object({
        displayName: z.string(),
    }).optional(),
})

export const ConnectionEvent = z.object({
    ...BaseAuditEventProps,
    action: z.union([
        z.literal(ApplicationEventName.CONNECTION_DELETED),
        z.literal(ApplicationEventName.CONNECTION_UPSERTED),
    ]),
    data: ConnectionEventData,
})
export type ConnectionEvent = z.infer<typeof ConnectionEvent>

export const ConnectionUpsertedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.CONNECTION_UPSERTED),
    data: ConnectionEventData,
})
export type ConnectionUpsertedEvent = z.infer<typeof ConnectionUpsertedEvent>

export const ConnectionDeletedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.CONNECTION_DELETED),
    data: ConnectionEventData,
})
export type ConnectionDeletedEvent = z.infer<typeof ConnectionDeletedEvent>

const FolderEventData = z.object({
    folder: Folder.pick({ id: true, displayName: true, created: true, updated: true }),
    project: z.object({
        displayName: z.string(),
    }).optional(),
})

export const FolderEvent = z.object({
    ...BaseAuditEventProps,
    action: z.union([
        z.literal(ApplicationEventName.FOLDER_UPDATED),
        z.literal(ApplicationEventName.FOLDER_CREATED),
        z.literal(ApplicationEventName.FOLDER_DELETED),
    ]),
    data: FolderEventData,
})

export type FolderEvent = z.infer<typeof FolderEvent>

export const FolderCreatedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FOLDER_CREATED),
    data: FolderEventData,
})
export type FolderCreatedEvent = z.infer<typeof FolderCreatedEvent>

export const FolderUpdatedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FOLDER_UPDATED),
    data: FolderEventData,
})
export type FolderUpdatedEvent = z.infer<typeof FolderUpdatedEvent>

export const FolderDeletedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FOLDER_DELETED),
    data: FolderEventData,
})
export type FolderDeletedEvent = z.infer<typeof FolderDeletedEvent>

const FlowRunEventData = z.object({
    flowRun: z.object({
        id: z.string(),
        startTime: z.string().nullish(),
        finishTime: z.string().nullish(),
        duration: z.number().optional(),
        triggeredBy: z.string().optional(),
        environment: z.string(),
        flowId: z.string(),
        flowVersionId: z.string(),
        stepNameToTest: z.string().optional(),
        flowDisplayName: z.string().optional(),
        status: z.string(),
    }),
    project: z.object({
        displayName: z.string(),
    }).optional(),
})

export const FlowRunEvent = z.object({
    ...BaseAuditEventProps,
    action: z.union([
        z.literal(ApplicationEventName.FLOW_RUN_STARTED),
        z.literal(ApplicationEventName.FLOW_RUN_FINISHED),
        z.literal(ApplicationEventName.FLOW_RUN_RESUMED),
        z.literal(ApplicationEventName.FLOW_RUN_RETRIED),
    ]),
    data: FlowRunEventData,
})
export type FlowRunEvent = z.infer<typeof FlowRunEvent>

export const FlowRunStartedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_RUN_STARTED),
    data: FlowRunEventData,
})
export type FlowRunStartedEvent = z.infer<typeof FlowRunStartedEvent>

export const FlowRunFinishedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_RUN_FINISHED),
    data: FlowRunEventData,
})
export type FlowRunFinishedEvent = z.infer<typeof FlowRunFinishedEvent>

export const FlowRunRetriedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_RUN_RETRIED),
    data: FlowRunEventData,
})
export type FlowRunRetriedEvent = z.infer<typeof FlowRunRetriedEvent>

export const FlowCreatedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_CREATED),
    data: z.object({
        flow: Flow.pick({ id: true, externalId: true, created: true, updated: true }),
        project: z.object({
            displayName: z.string(),
            externalId: Nullable(z.string()),
        }).optional(),
    }),
})

export type FlowCreatedEvent = z.infer<typeof FlowCreatedEvent>

export const FlowDeletedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_DELETED),
    data: z.object({
        flow: Flow.pick({ id: true, externalId: true, created: true, updated: true }),
        flowVersion: FlowVersion.pick({
            id: true,
            displayName: true,
            flowId: true,
            created: true,
            updated: true,
        }),
        project: z.object({
            displayName: z.string(),
            externalId: Nullable(z.string()),
        }).optional(),
    }),
})

export type FlowDeletedEvent = z.infer<typeof FlowDeletedEvent>

export const FlowUpdatedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_UPDATED),
    data: z.object({
        flow: Flow.pick({ id: true, externalId: true, created: true, updated: true }),
        flowVersion: FlowVersion.pick({
            id: true,
            displayName: true,
            flowId: true,
            created: true,
            updated: true,
        }),
        request: FlowOperationRequest,
        project: z.object({
            displayName: z.string(),
            externalId: Nullable(z.string()),
        }).optional(),
    }),
})

export type FlowUpdatedEvent = z.infer<typeof FlowUpdatedEvent>

const FlowLifecycleEventData = z.object({
    flow: Flow.pick({ id: true, externalId: true, created: true, updated: true }),
    flowVersion: FlowVersion.pick({
        id: true,
        displayName: true,
        flowId: true,
        created: true,
        updated: true,
    }),
    project: z.object({
        displayName: z.string(),
        externalId: Nullable(z.string()),
    }).optional(),
})

export const FlowPublishedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_PUBLISHED),
    data: FlowLifecycleEventData,
})

export type FlowPublishedEvent = z.infer<typeof FlowPublishedEvent>

export const FlowActivatedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_ACTIVATED),
    data: FlowLifecycleEventData,
})

export type FlowActivatedEvent = z.infer<typeof FlowActivatedEvent>

export const FlowDeactivatedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.FLOW_DEACTIVATED),
    data: FlowLifecycleEventData,
})

export type FlowDeactivatedEvent = z.infer<typeof FlowDeactivatedEvent>

const AuthenticationEventData = z.object({
    user: UserMeta.optional(),
})

export const AuthenticationEvent = z.object({
    ...BaseAuditEventProps,
    action: z.union([
        z.literal(ApplicationEventName.USER_SIGNED_IN),
        z.literal(ApplicationEventName.USER_PASSWORD_RESET),
        z.literal(ApplicationEventName.USER_EMAIL_VERIFIED),
    ]),
    data: AuthenticationEventData,
})

export type AuthenticationEvent = z.infer<typeof AuthenticationEvent>

export const UserSignedInEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.USER_SIGNED_IN),
    data: AuthenticationEventData,
})
export type UserSignedInEvent = z.infer<typeof UserSignedInEvent>

export const UserPasswordResetEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.USER_PASSWORD_RESET),
    data: AuthenticationEventData,
})
export type UserPasswordResetEvent = z.infer<typeof UserPasswordResetEvent>

export const UserEmailVerifiedEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.USER_EMAIL_VERIFIED),
    data: AuthenticationEventData,
})
export type UserEmailVerifiedEvent = z.infer<typeof UserEmailVerifiedEvent>

export const SignUpEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.USER_SIGNED_UP),
    data: z.object({
        source: z.union([
            z.literal('credentials'),
            z.literal('sso'),
            z.literal('managed'),
        ]),
        user: UserMeta.optional(),
    }),
})
export type SignUpEvent = z.infer<typeof SignUpEvent>

export const SigningKeyEvent = z.object({
    ...BaseAuditEventProps,
    action: z.union([z.literal(ApplicationEventName.SIGNING_KEY_CREATED)]),
    data: z.object({
        signingKey: SigningKey.pick({
            id: true,
            created: true,
            updated: true,
            displayName: true,
        }),
    }),
})

export type SigningKeyEvent = z.infer<typeof SigningKeyEvent>

export const ProjectRoleEvent = z.object({
    ...BaseAuditEventProps,
    action: z.union([
        z.literal(ApplicationEventName.PROJECT_ROLE_CREATED),
        z.literal(ApplicationEventName.PROJECT_ROLE_UPDATED),
        z.literal(ApplicationEventName.PROJECT_ROLE_DELETED),
    ]),
    data: z.object({
        projectRole: ProjectRole.pick({
            id: true,
            created: true,
            updated: true,
            name: true,
            permissions: true,
            platformId: true,
        }),
    }),
})

export type ProjectRoleEvent = z.infer<typeof ProjectRoleEvent>

export const ProjectReleaseEvent = z.object({
    ...BaseAuditEventProps,
    action: z.literal(ApplicationEventName.PROJECT_RELEASE_CREATED),
    data: z.object({
        release: z.object({
            name: z.string(),
            description: Nullable(z.string()),
            type: z.string(),
            projectId: z.string(),
            importedByUser: z.object({
                id: z.string(),
                email: z.string(),
                firstName: z.string(),
                status: z.string(),
                externalId: Nullable(z.string()),
                platformId: Nullable(z.string()),
                platformRole: z.string(),
                lastName: z.string(),
                created: DateOrString,
                updated: DateOrString,
                lastActiveDate: Nullable(z.string()),
                imageUrl: Nullable(z.string()),
            }).optional(),
        }),
    }),
})

export type ProjectReleaseEvent = z.infer<typeof ProjectReleaseEvent>

export const ApplicationEvent = z.union([
    ConnectionEvent,
    FlowCreatedEvent,
    FlowDeletedEvent,
    FlowUpdatedEvent,
    FlowPublishedEvent,
    FlowActivatedEvent,
    FlowDeactivatedEvent,
    FlowRunEvent,
    AuthenticationEvent,
    FolderEvent,
    SignUpEvent,
    SigningKeyEvent,
    ProjectRoleEvent,
    ProjectReleaseEvent,
])

export type ApplicationEvent = z.infer<typeof ApplicationEvent>

export function summarizeApplicationEvent(event: ApplicationEvent) {
    switch (event.action) {
        case ApplicationEventName.FLOW_UPDATED: {
            return convertUpdateActionToDetails(event)
        }
        case ApplicationEventName.FLOW_RUN_STARTED:
            return `Flow run ${event.data.flowRun.id} is started`
        case ApplicationEventName.FLOW_RUN_FINISHED: {
            return `Flow run ${event.data.flowRun.id} is finished`
        }
        case ApplicationEventName.FLOW_RUN_RESUMED: {
            return `Flow run ${event.data.flowRun.id} is resumed`
        }
        case ApplicationEventName.FLOW_RUN_RETRIED: {
            return `Flow run ${event.data.flowRun.id} is retried from a failed step`
        }
        case ApplicationEventName.FLOW_CREATED:
            return `Flow ${event.data.flow.id} is created`
        case ApplicationEventName.FLOW_DELETED:
            return `Flow ${event.data.flow.id} (${event.data.flowVersion.displayName}) is deleted`
        case ApplicationEventName.FLOW_PUBLISHED:
            return `Flow "${event.data.flowVersion.displayName}" was published`
        case ApplicationEventName.FLOW_ACTIVATED:
            return `Flow "${event.data.flowVersion.displayName}" was activated`
        case ApplicationEventName.FLOW_DEACTIVATED:
            return `Flow "${event.data.flowVersion.displayName}" was deactivated`
        case ApplicationEventName.FOLDER_CREATED:
            return `${event.data.folder.displayName} is created`
        case ApplicationEventName.FOLDER_UPDATED:
            return `${event.data.folder.displayName} is updated`
        case ApplicationEventName.FOLDER_DELETED:
            return `${event.data.folder.displayName} is deleted`
        case ApplicationEventName.CONNECTION_UPSERTED:
            return `${event.data.connection.displayName} (${event.data.connection.externalId}) is updated`
        case ApplicationEventName.CONNECTION_DELETED:
            return `${event.data.connection.displayName} (${event.data.connection.externalId}) is deleted`
        case ApplicationEventName.USER_SIGNED_IN:
            return `User ${event.userEmail} signed in`
        case ApplicationEventName.USER_PASSWORD_RESET:
            return `User ${event.userEmail} reset password`
        case ApplicationEventName.USER_EMAIL_VERIFIED:
            return `User ${event.userEmail} verified email`
        case ApplicationEventName.USER_SIGNED_UP:
            return `User ${event.userEmail} signed up using email from ${event.data.source}`
        case ApplicationEventName.SIGNING_KEY_CREATED:
            return `${event.data.signingKey.displayName} is created`
        case ApplicationEventName.PROJECT_ROLE_CREATED:
            return `${event.data.projectRole.name} is created`
        case ApplicationEventName.PROJECT_ROLE_UPDATED:
            return `${event.data.projectRole.name} is updated`
        case ApplicationEventName.PROJECT_ROLE_DELETED:
            return `${event.data.projectRole.name} is deleted`
        case ApplicationEventName.PROJECT_RELEASE_CREATED:
            return `${event.data.release.name} is created`
    }
}

function convertUpdateActionToDetails(event: FlowUpdatedEvent) {
    switch (event.data.request.type) {
        case FlowOperationType.ADD_ACTION:
            return `Added action "${event.data.request.request.action.displayName}" to "${event.data.flowVersion.displayName}" Flow.`
        case FlowOperationType.UPDATE_ACTION:
            return `Updated action "${event.data.request.request.displayName}" in "${event.data.flowVersion.displayName}" Flow.`
        case FlowOperationType.DELETE_ACTION:
        {
            const request = event.data.request.request
            const names = request.names
            return `Deleted actions "${names.join(', ')}" from "${event.data.flowVersion.displayName}" Flow.`
        }
        case FlowOperationType.CHANGE_NAME:
            return `Renamed flow "${event.data.flowVersion.displayName}" to "${event.data.request.request.displayName}".`
        case FlowOperationType.LOCK_AND_PUBLISH:
            return `Locked and published flow "${event.data.flowVersion.displayName}" Flow.`
        case FlowOperationType.USE_AS_DRAFT:
            return `Unlocked and unpublished flow "${event.data.flowVersion.displayName}" Flow.`
        case FlowOperationType.MOVE_ACTION:
            return `Moved action "${event.data.request.request.name}" to after "${event.data.request.request.newParentStep}".`
        case FlowOperationType.LOCK_FLOW:
            return `Locked flow "${event.data.flowVersion.displayName}" Flow.`
        case FlowOperationType.CHANGE_STATUS:
            return `Changed status of flow "${event.data.flowVersion.displayName}" Flow to "${event.data.request.request.status}".`
        case FlowOperationType.DUPLICATE_ACTION:
            return `Duplicated action "${event.data.request.request.stepName}" in "${event.data.flowVersion.displayName}" Flow.`
        case FlowOperationType.IMPORT_FLOW:
            return `Imported flow in "${event.data.request.request.displayName}" Flow.`
        case FlowOperationType.UPDATE_TRIGGER:
            return `Updated trigger in "${event.data.flowVersion.displayName}" Flow to "${event.data.request.request.displayName}".`
        case FlowOperationType.CHANGE_FOLDER:
            return `Moved flow "${event.data.flowVersion.displayName}" to folder id ${event.data.request.request.folderId}.`
        case FlowOperationType.DELETE_BRANCH: {
            return `Deleted branch number ${
                event.data.request.request.branchIndex + 1
            } in flow "${event.data.flowVersion.displayName}" for the step "${
                event.data.request.request.stepName
            }".`
        }
        case FlowOperationType.SAVE_SAMPLE_DATA: {
            return `Saved sample data for step "${event.data.request.request.stepName}" in flow "${event.data.flowVersion.displayName}".`
        }
        case FlowOperationType.DUPLICATE_BRANCH: {
            return `Duplicated branch number ${
                event.data.request.request.branchIndex + 1
            } in flow "${event.data.flowVersion.displayName}" for the step "${
                event.data.request.request.stepName
            }".`
        }
        case FlowOperationType.ADD_BRANCH:
            return `Added branch number ${
                event.data.request.request.branchIndex + 1
            } in flow "${event.data.flowVersion.displayName}" for the step "${
                event.data.request.request.stepName
            }".`
        case FlowOperationType.SET_SKIP_ACTION:
        {
            const request = event.data.request.request
            const names = request.names
            return `Updated actions "${names.join(', ')}" in "${event.data.flowVersion.displayName}" Flow to skip.`
        }
        case FlowOperationType.UPDATE_METADATA:
            return `Updated metadata for flow "${event.data.flowVersion.displayName}".`
        case FlowOperationType.UPDATE_MINUTES_SAVED:
            return `Updated minutes saved for flow "${event.data.flowVersion.displayName}".`
        case FlowOperationType.UPDATE_OWNER:
            return `Updated owner for flow "${event.data.flowVersion.displayName}" to "${event.data.request.request.ownerId}".`
        case FlowOperationType.MOVE_BRANCH:
            return `Moved branch number ${
                event.data.request.request.sourceBranchIndex + 1
            } to ${
                event.data.request.request.targetBranchIndex + 1
            } in flow "${event.data.flowVersion.displayName}" for the step "${
                event.data.request.request.stepName
            }".`
        case FlowOperationType.ADD_NOTE:
            return `Added note to flow "${event.data.flowVersion.displayName}".`
        case FlowOperationType.UPDATE_NOTE:
            return `Updated note in flow "${event.data.flowVersion.displayName}".`
        case FlowOperationType.DELETE_NOTE:
            return `Deleted note in flow "${event.data.flowVersion.displayName}".`
        case FlowOperationType.UPDATE_SAMPLE_DATA_INFO:
            return `Updated sample data info for step "${event.data.request.request.stepName}" in flow "${event.data.flowVersion.displayName}".`
    }
}

export * from './mock-event-builder'
