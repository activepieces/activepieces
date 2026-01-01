import {
    ApplicationEvent,
} from '@activepieces/ee-shared'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    apId,
    Cursor,
    isNil,
    SeekPage,
} from '@activepieces/shared'
import { Value } from '@sinclair/typebox/value'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { applicationEvents, AuditEventParam, MetaInformation } from '../../helper/application-events'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { AuditEventEntity } from './audit-event-entity'

export const auditLogRepo = repoFactory(AuditEventEntity)

export const auditLogService = (log: FastifyBaseLogger) => ({
    setup(): void {
        applicationEvents.registerListeners(log, {
            userEvent: (log) => (requestInformation, params) => {
                rejectedPromiseHandler(saveEvent(requestInformation, params, log), log)
            },
            workerEvent: (log) => (projectId, params) => {
                rejectedPromiseHandler(projectService.getOneOrThrow(projectId).then((project) => {
                    rejectedPromiseHandler(saveEvent({
                        platformId: project.platformId,
                        projectId,
                        userId: undefined,
                        ip: undefined,
                    }, params, log), log)
                }), log)
            },
        })
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
