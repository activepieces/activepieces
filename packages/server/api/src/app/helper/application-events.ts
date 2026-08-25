import { apId, isNil, PlatformId, ProjectId, tryCatch, UserId } from '@activepieces/core-utils'
import { ApplicationEvent, PrincipalType } from '@activepieces/shared'
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

type SendWorkerEventParams = RawAuditEventParam & {
    projectId: ProjectId
    platformId: PlatformId
}

export const applicationEvents = (log: FastifyBaseLogger) => ({
    registerListeners(log: FastifyBaseLogger, registration: {
        userEvent: (log: FastifyBaseLogger) => UserEventListener
        workerEvent: (log: FastifyBaseLogger) => WorkerEventListener
    }): void {
        listeners.userEventListeners.push(registration.userEvent(log))
        listeners.workerEventListeners.push(registration.workerEvent(log))
    },
    sendUserEvent(requestOrMeta: ApplicationEventSource, params: RawAuditEventParam): void {
        rejectedPromiseHandler(enrichAuditEventParam(requestOrMeta, params, log).then((event) => {
            if (!isNil(event)) {
                for (const listener of listeners.userEventListeners) {
                    listener(event)
                }
            }
        }), log)
    },
    sendWorkerEvent({ projectId, platformId, action, data }: SendWorkerEventParams): void {
        for (const listener of listeners.workerEventListeners) {
            const event = {
                action,
                data,
                projectId,
                platformId,
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            } as ApplicationEvent
            listener(projectId, event)
        }
    },
})


async function enrichAuditEventParam(requestOrMeta: ApplicationEventSource, params: RawAuditEventParam, log: FastifyBaseLogger): Promise<ApplicationEvent | undefined> {
    const meta = await extractMetaInformation(requestOrMeta, log)
    if (isNil(meta)) {
        return undefined
    }
    const project = isNil(meta.projectId) ? undefined : await projectService(log).getOne(meta.projectId)
    const userId = meta.userId ?? project?.ownerId
    const { data: user } = await tryCatch(async () => isNil(userId) ? undefined : userService(log).getOneOrFail({ id: userId }))
    const identity = isNil(user?.identityId) ? undefined : await userIdentityService(log).getOneOrFail({ id: user.identityId })
    const eventToSave: unknown = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        userId,
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

async function extractMetaInformation(requestOrMeta: ApplicationEventSource, log: FastifyBaseLogger): Promise<MetaInformation | undefined> {
    if (isFastifyRequest(requestOrMeta)) {
        const request = requestOrMeta
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
    return requestOrMeta
}

function isFastifyRequest(requestOrMeta: ApplicationEventSource): requestOrMeta is FastifyRequest {
    return 'principal' in requestOrMeta
}

export type MetaInformation = {
    platformId: PlatformId
    userId?: UserId | null
    projectId?: ProjectId
    ip?: string
}

type ApplicationEventSource = FastifyRequest | MetaInformation
