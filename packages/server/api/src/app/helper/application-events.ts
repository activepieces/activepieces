import { apId, ApplicationEvent, isNil, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { authenticationUtils } from '../authentication/authentication-utils'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { networkUtils } from './network-utils'
import { rejectedPromiseHandler } from './promise-handler'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'


type UserEventListener = (params: ApplicationEvent) => void
type WorkerEventListener = (projectId: string, params: ApplicationEvent) => void

type ListenerRegistration = {
    userEventListeners: UserEventListener[]
    workerEventListeners: WorkerEventListener[]
}

const listeners: ListenerRegistration = {
    userEventListeners: [],
    workerEventListeners: [],
}

type RawAuditEventParam = Pick<ApplicationEvent, 'data' | 'action'>

type MetaInformation = {
    platformId: string
    userId?: string
    projectId?: string
    ip?: string
}

export const applicationEvents = (log: FastifyBaseLogger) => ({
    registerListeners(log: FastifyBaseLogger, registration: {
        userEvent: (log: FastifyBaseLogger) => UserEventListener
        workerEvent: (log: FastifyBaseLogger) => WorkerEventListener
    }): void {
        listeners.userEventListeners.push(registration.userEvent(log))
        listeners.workerEventListeners.push(registration.workerEvent(log))
    },
    sendUserEvent(requestOrMeta: FastifyRequest | MetaInformation, params: RawAuditEventParam): void {
        rejectedPromiseHandler(enrichAuditEventParam(requestOrMeta, params, log).then((event) => {
            if (!isNil(event)) {
                for (const listener of listeners.userEventListeners) {
                    listener(event)
                }
            }
        }), log)
    },
    sendWorkerEvent(projectId: string, params: RawAuditEventParam): void {
        projectService(log).getPlatformId(projectId).then((platformId) => {
            for (const listener of listeners.workerEventListeners) {
                const event = {
                    ...params,
                    projectId,
                    platformId,
                    id: apId(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                } as ApplicationEvent
                listener(projectId, event)
            }
        }).catch((error) => {
            log.error({ err: error }, '[applicationEvents#sendWorkerEvent] Failed to send worker event')
        })
    },
})


async function enrichAuditEventParam(requestOrMeta: FastifyRequest | MetaInformation, params: RawAuditEventParam, log: FastifyBaseLogger): Promise<ApplicationEvent | undefined> {
    const meta = await extractMetaInformation(requestOrMeta, log)
    if (isNil(meta)) {
        return undefined
    }
    const user = meta.userId ? await userService(log).getOneOrFail({ id: meta.userId }) : undefined
    const identity = !isNil(user?.identityId) ? await userIdentityService(log).getOneOrFail({ id: user.identityId }) : undefined
    const project = meta.projectId ? await projectService(log).getOne(meta.projectId) : undefined
    const eventToSave: unknown = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        userId: meta.userId,
        userEmail: identity?.email,
        projectId: meta.projectId,
        projectDisplayName: project?.displayName,
        platformId: meta.platformId,
        ip: meta.ip,
        data: {
            ...params.data,
            project,
            user,
        },
        action: params.action,
    }

    // The event may contain Date objects, so we serialize it to convert dates back to strings as per the schema.
    const cleanedEvent = JSON.parse(JSON.stringify(eventToSave)) as ApplicationEvent
    return cleanedEvent
}

async function extractMetaInformation(requestOrMeta: FastifyRequest | MetaInformation, log: FastifyBaseLogger): Promise<MetaInformation | undefined> {
    const isRequest = 'principal' in requestOrMeta
    if (isRequest) {
        const request = requestOrMeta as FastifyRequest
        const principal = request.principal
        if (!principal || principal.type === PrincipalType.UNKNOWN || principal.type === PrincipalType.WORKER) {
            return undefined
        }
        const extractedUserId = await authenticationUtils(log).extractUserIdFromRequest(request)
        const projectId = request.projectId ?? principal.projectId
        const meta: MetaInformation = {
            platformId: principal.platform.id,
            projectId,
            userId: extractedUserId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }
        return meta
    }
    return requestOrMeta as MetaInformation
}