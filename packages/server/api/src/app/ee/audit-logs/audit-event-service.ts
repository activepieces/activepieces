import {
    ApplicationEvent,
} from '@activepieces/ee-shared'
import { logger, networkUtls, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    apId,
    Cursor,
    isNil,
    PrincipalType,
    SeekPage,
} from '@activepieces/shared'
import { Value } from '@sinclair/typebox/value'
import { FastifyRequest } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { AuditEventParam } from '../../helper/application-events'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { AuditEventEntity } from './audit-event-entity'

export const auditLogRepo = repoFactory(AuditEventEntity)

export const auditLogService = {
    sendUserEvent(requestInformation: MetaInformation, params: AuditEventParam): void {
        rejectedPromiseHandler(saveEvent(requestInformation, params))
    },
    sendUserEventFromRequest(request: FastifyRequest, params: AuditEventParam): void {
        if ([PrincipalType.UNKNOWN, PrincipalType.WORKER].includes(request.principal.type)) {
            return
        }
        rejectedPromiseHandler(saveEvent({
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            userId: request.principal.id,
            ip: networkUtls.extractClientRealIp(request),
        }, params))
    },
    sendWorkerEvent(projectId: string, params: AuditEventParam): void {
        rejectedPromiseHandler(projectService.getOneOrThrow(projectId).then((project) => {
            rejectedPromiseHandler(saveEvent({
                platformId: project.platformId,
                projectId,
                userId: undefined,
                ip: undefined,
            }, params))
        }))
    },
    async list({ platformId, cursorRequest, limit, userId, action, projectId }: ListParams): Promise<SeekPage<ApplicationEvent>> {
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
            queryBuilder.andWhere({ action })
        }
        if (!isNil(projectId)) {
            queryBuilder.andWhere({ projectId })
        }

        const paginationResponse = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<ApplicationEvent>(
            paginationResponse.data,
            paginationResponse.cursor,
        )
    },
}

async function saveEvent(info: MetaInformation, rawEvent: AuditEventParam): Promise<void> {
    const platformId = info.platformId
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.auditLogEnabled) {
        return
    }
    const user = info.userId ? await userService.getOneOrFail({
        id: info.userId,
    }) : undefined
    const project = info.projectId ? await projectService.getOne(info.projectId) : undefined
    const eventToSave: unknown = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        userId: info.userId,
        userEmail: user?.email,
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

    const savedEvent = await auditLogRepo().save(cleanedEvent)
    logger.info({
        message: '[AuditEventService#saveEvent] Audit event saved',
        appEvent: savedEvent,
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
    action?: string
    projectId?: string
}