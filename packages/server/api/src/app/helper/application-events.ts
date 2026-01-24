import { ApplicationEvent } from '@activepieces/ee-shared'
import { AppSystemProp, networkUtils, rejectedPromiseHandler } from '@activepieces/server-shared'
import { apId, isNil, PrincipalType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { Clean } from '@sinclair/typebox/value'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { authenticationUtils } from '../authentication/authentication-utils'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { system } from './system/system'


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

const RawAuditEventParam = Type.Pick(ApplicationEvent, ['data', 'action'])
type RawAuditEventParam = Static<typeof RawAuditEventParam>

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
        projectService.getPlatformId(projectId).then((platformId) => {
            for (const listener of listeners.workerEventListeners) {
                listener(projectId, {
                    ...params,
                    projectId,
                    platformId,
                    id: apId(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                })
            }
        }).catch((error) => {
            log.error(error)
        })
    },
})


async function enrichAuditEventParam(requestOrMeta: FastifyRequest | MetaInformation, params: RawAuditEventParam, log: FastifyBaseLogger): Promise<ApplicationEvent | undefined> {
    const meta = await extractMetaInformation(requestOrMeta)
    if (isNil(meta)) {
        return undefined
    }
    const user = meta.userId ? await userService.getOneOrFail({ id: meta.userId }) : undefined
    const identity = !isNil(user?.identityId) ? await userIdentityService(log).getOneOrFail({ id: user.identityId }) : undefined
    const project = meta.projectId ? await projectService.getOne(meta.projectId) : undefined
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
    const clonedAndSerializedDates = JSON.parse(JSON.stringify(eventToSave))
    const cleanedEvent = Clean(ApplicationEvent, clonedAndSerializedDates) as ApplicationEvent
    return cleanedEvent
}

async function extractMetaInformation(requestOrMeta: FastifyRequest | MetaInformation): Promise<MetaInformation | undefined> {
    const isRequest = 'principal' in requestOrMeta
    if (isRequest) {
        const request = requestOrMeta as FastifyRequest
        const principal = request.principal
        if (!principal || principal.type === PrincipalType.UNKNOWN || principal.type === PrincipalType.WORKER) {
            return undefined
        }
        const extractedUserId = await authenticationUtils.extractUserIdFromRequest(request)
        const meta: MetaInformation = {
            platformId: principal.platform.id,
            projectId: principal.projectId,
            userId: extractedUserId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }
        return meta
    }
    return requestOrMeta as MetaInformation
}