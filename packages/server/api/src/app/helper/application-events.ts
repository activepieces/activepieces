import { AppSystemProp, networkUtils } from '@activepieces/server-shared'
import { FlowOperationRequest, FlowRun, FlowVersion, PrincipalType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { authenticationUtils } from '../authentication/authentication-utils'
import { system } from './system/system'

// Define simplified event types for community edition
export enum ApplicationEventName {
    // Connection events
    CONNECTION_UPSERTED = 'connection.upserted',
    CONNECTION_DELETED = 'connection.deleted',

    // Flow events
    FLOW_CREATED = 'flow.created',
    FLOW_UPDATED = 'flow.updated',
    FLOW_DELETED = 'flow.deleted',

    // Flow run events
    FLOW_RUN_STARTED = 'flow-run.started',
    FLOW_RUN_FINISHED = 'flow-run.finished',
    FLOW_RUN_RESUMED = 'flow-run.resumed',

    // Auth events
    USER_SIGNED_UP = 'user.signed-up',
    USER_SIGNED_IN = 'user.signed-in',

    // Folder events
    FOLDER_CREATED = 'folder.created',
    FOLDER_UPDATED = 'folder.updated',
    FOLDER_DELETED = 'folder.deleted',

    // Signing key events
    SIGNING_KEY_CREATED = 'signing-key.created',

    // Project role events
    PROJECT_ROLE_CREATED = 'project-role.created',
    PROJECT_ROLE_UPDATED = 'project-role.updated',
    PROJECT_ROLE_DELETED = 'project-role.deleted',

    // Project release events
    PROJECT_RELEASE_CREATED = 'project-release.created',
}

// Simplified event schemas
const ConnectionEvent = Type.Object({
    action: Type.Union([
        Type.Literal(ApplicationEventName.CONNECTION_UPSERTED),
        Type.Literal(ApplicationEventName.CONNECTION_DELETED),
    ]),
    data: Type.Object({
        connection: Type.Any(),
    }),
})

const FlowCreatedEvent = Type.Object({
    action: Type.Literal(ApplicationEventName.FLOW_CREATED),
    data: Type.Object({
        flow: Type.Any(),
    }),
})

const FlowDeletedEvent = Type.Object({
    action: Type.Literal(ApplicationEventName.FLOW_DELETED),
    data: Type.Object({
        flow: Type.Any(),
        flowVersion: Type.Any(),
    }),
})

const FlowUpdatedEvent = Type.Object({
    action: Type.Literal(ApplicationEventName.FLOW_UPDATED),
    data: Type.Object({
        request: Type.Any(),
        flowVersion: Type.Any(),
    }),
})
export type FlowUpdatedEvent = {
    action: ApplicationEventName.FLOW_UPDATED
    data: {
        request: FlowOperationRequest
        flowVersion: FlowVersion
    }
}

const AuthenticationEvent = Type.Object({
    action: Type.Union([
        Type.Literal(ApplicationEventName.USER_SIGNED_UP),
        Type.Literal(ApplicationEventName.USER_SIGNED_IN),
    ]),
    data: Type.Any(),
})

const FolderEvent = Type.Object({
    action: Type.Union([
        Type.Literal(ApplicationEventName.FOLDER_CREATED),
        Type.Literal(ApplicationEventName.FOLDER_UPDATED),
        Type.Literal(ApplicationEventName.FOLDER_DELETED),
    ]),
    data: Type.Object({
        folder: Type.Any(),
    }),
})

const SignUpEvent = Type.Object({
    action: Type.Literal(ApplicationEventName.USER_SIGNED_UP),
    data: Type.Object({
        source: Type.String(),
    }),
})

const SigningKeyEvent = Type.Object({
    action: Type.Literal(ApplicationEventName.SIGNING_KEY_CREATED),
    data: Type.Object({
        signingKey: Type.Any(),
    }),
})

const FlowRunEvent = Type.Object({
    action: Type.Union([
        Type.Literal(ApplicationEventName.FLOW_RUN_STARTED),
        Type.Literal(ApplicationEventName.FLOW_RUN_FINISHED),
        Type.Literal(ApplicationEventName.FLOW_RUN_RESUMED),
    ]),
    data: Type.Object({
        flowRun: Type.Any(),
    }),
})
export type FlowRunEvent = {
    action: ApplicationEventName.FLOW_RUN_STARTED | ApplicationEventName.FLOW_RUN_FINISHED | ApplicationEventName.FLOW_RUN_RESUMED
    data: {
        flowRun: FlowRun
    }
}

const ProjectRoleEvent = Type.Object({
    action: Type.Union([
        Type.Literal(ApplicationEventName.PROJECT_ROLE_CREATED),
        Type.Literal(ApplicationEventName.PROJECT_ROLE_UPDATED),
        Type.Literal(ApplicationEventName.PROJECT_ROLE_DELETED),
    ]),
    data: Type.Object({
        projectRole: Type.Any(),
    }),
})

const ProjectReleaseEvent = Type.Object({
    action: Type.Literal(ApplicationEventName.PROJECT_RELEASE_CREATED),
    data: Type.Object({
        release: Type.Any(),
    }),
})

export const AuditEventParam = Type.Pick(Type.Union([
    ConnectionEvent,
    FlowCreatedEvent,
    FlowDeletedEvent,
    FlowUpdatedEvent,
    AuthenticationEvent,
    FolderEvent,
    SignUpEvent,
    SigningKeyEvent,
    FlowRunEvent,
    ProjectRoleEvent,
    ProjectReleaseEvent,
]), ['data', 'action'])
export type AuditEventParam = Static<typeof AuditEventParam>

export type MetaInformation = {
    platformId: string
    userId?: string
    projectId?: string
    ip?: string
}

type UserEventListener = (requestInformation: MetaInformation, params: AuditEventParam) => void
type WorkerEventListener = (projectId: string, params: AuditEventParam) => void

type ListenerRegistration = {
    userEventListeners: UserEventListener[]
    workerEventListeners: WorkerEventListener[]
}

const listeners: ListenerRegistration = {
    userEventListeners: [],
    workerEventListeners: [],
}

export const applicationEvents = {
    registerListeners(log: FastifyBaseLogger, registration: {
        userEvent: (log: FastifyBaseLogger) => UserEventListener
        workerEvent: (log: FastifyBaseLogger) => WorkerEventListener
    }): void {
        listeners.userEventListeners.push(registration.userEvent(log))
        listeners.workerEventListeners.push(registration.workerEvent(log))
    },
    sendUserEvent(requestOrMeta: FastifyRequest | MetaInformation, params: AuditEventParam): void {
        const isRequest = 'principal' in requestOrMeta
        if (isRequest) {
            const request = requestOrMeta as FastifyRequest
            const principal = request.principal
            if (!principal || principal.type === PrincipalType.UNKNOWN || principal.type === PrincipalType.WORKER) {
                return
            }
            authenticationUtils.extractUserIdFromRequest(request).then((userId) => {
                const meta: MetaInformation = {
                    platformId: principal.platform.id,
                    projectId: principal.projectId,
                    userId,
                    ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
                }
                for (const listener of listeners.userEventListeners) {
                    listener(meta, params)
                }
            }).catch((error) => {
                request.log.error({ error }, '[ApplicationEvents#sendUserEvent] Failed to extract user ID from principal')
            })
        }
        else {
            const meta = requestOrMeta as MetaInformation
            for (const listener of listeners.userEventListeners) {
                listener(meta, params)
            }
        }
    },
    sendWorkerEvent(projectId: string, params: AuditEventParam): void {
        for (const listener of listeners.workerEventListeners) {
            listener(projectId, params)
        }
    },
}
