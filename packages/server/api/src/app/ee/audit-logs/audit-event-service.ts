import {
    ApplicationEvent,
} from '@activepieces/ee-shared'
import { AppSystemProp, networkUtils, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    apId,
    Cursor,
    isNil,
    PrincipalType,
    SeekPage,
} from '@activepieces/shared'
import { Value } from '@sinclair/typebox/value'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { In } from 'typeorm'
import { authenticationUtils } from '../../authentication/authentication-utils'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { AuditEventParam } from '../../helper/application-events'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { AuditEventEntity } from './audit-event-entity'

export const auditLogRepo = repoFactory(AuditEventEntity)

export const auditLogService = (log: FastifyBaseLogger) => ({
    sendUserEvent(requestInformation: MetaInformation, params: AuditEventParam): void {
        rejectedPromiseHandler(saveEvent(requestInformation, params, log), log)
    },
    sendUserEventFromRequest(request: FastifyRequest, params: AuditEventParam): void {
        if ([PrincipalType.UNKNOWN, PrincipalType.WORKER].includes(request.principal.type)) {
            return
        }
        rejectedPromiseHandler((async () => {
            const userId = await authenticationUtils.extractUserIdFromPrincipal(request.principal)
            await saveEvent({
                platformId: request.principal.platform.id,
                projectId: request.principal.projectId,
                userId,
                ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, params, log)
        })(), log)
    },
    sendWorkerEvent(projectId: string, params: AuditEventParam): void {
        rejectedPromiseHandler(projectService.getOneOrThrow(projectId).then((project) => {
            rejectedPromiseHandler(saveEvent({
                platformId: project.platformId,
                projectId,
                userId: undefined,
                ip: undefined,
            }, params, log), log)
        }), log)
    },
    async list({ platformId, cursorRequest, limit, userId, action, projectId, createdBefore, createdAfter }: ListParams): Promise<SeekPage<ApplicationEvent>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: AuditEventEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = auditLogRepo().createQueryBuilder('audit_event')
            .where({ platformId })
        if (!isNil(userId)) {
            queryBuilder.andWhere({ userId })
        }
        if (!isNil(action)) {
            queryBuilder.andWhere({ action: In(action) })
        }
        
        if (!isNil(projectId)) {
            queryBuilder.andWhere({ projectId: In(projectId) })
        }

        if (createdAfter) {
            queryBuilder.andWhere('audit_event.created >= :createdAfter', {
                createdAfter,
            })
        }
        if (createdBefore) {
            queryBuilder.andWhere('audit_event.created <= :createdBefore', {
                createdBefore,
            })
        }

        const paginationResponse = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<ApplicationEvent>(
            paginationResponse.data,
            paginationResponse.cursor,
        )
    },
})

async function saveEvent(info: MetaInformation, rawEvent: AuditEventParam, log: FastifyBaseLogger): Promise<void> {
    const platformId = info.platformId
    const platform = await platformService.getOneWithPlanOrThrow(platformId)
    if (!platform.plan.auditLogEnabled) {
        return
    }
    const user = info.userId ? await userService.getOneOrFail({
        id: info.userId,
    }) : undefined
    const identity = !isNil(user?.identityId) ? await userIdentityService(log).getOneOrFail({
        id: user.identityId,
    }) : undefined
    const project = info.projectId ? await projectService.getOne(info.projectId) : undefined
    const eventToSave: unknown = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        userId: info.userId,
        userEmail: identity?.email,
        projectId: info.projectId,
        projectDisplayName: project?.displayName,
        platformId: info.platformId,
        ip: info.ip,
        data: {
            ...rawEvent.data,
            project,
            user,
        },
        action: rawEvent.action,
    }

    // The event may contain Date objects, so we serialize it to convert dates back to strings as per the schema.
    const clonedAndSerializedDates = JSON.parse(JSON.stringify(eventToSave))
    const cleanedEvent = Value.Clean(ApplicationEvent, clonedAndSerializedDates) as ApplicationEvent

    await auditLogRepo().save(cleanedEvent)
    log.info({
        action: cleanedEvent.action,
        message: '[AuditEventService#saveEvent] Audit event saved',
    })
}

type MetaInformation = {
    platformId: string
    projectId?: string
    userId?: string
    ip?: string
}


type ListParams = {
    platformId: string
    cursorRequest: Cursor | null
    limit: number
    userId?: string
    action?: string[]
    projectId?: string[]
    createdBefore?: string
    createdAfter?: string
}