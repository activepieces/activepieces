import { AuthenticationEvent, ConnectionEvent, FlowCreatedEvent, FlowDeletedEvent, FlowRunEvent, FlowUpdatedEvent, FolderEvent, ProjectReleaseEvent, ProjectRoleEvent, SigningKeyEvent, SignUpEvent } from '@activepieces/ee-shared'
import { AppSystemProp, networkUtils } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { authenticationUtils } from '../authentication/authentication-utils'
import { system } from './system/system'

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
