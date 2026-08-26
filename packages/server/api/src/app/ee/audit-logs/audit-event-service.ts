import { auditEvent, type AuditEventInput } from '@activepieces/server-utils'
import { Cursor, isNil, SeekPage, tryCatchSync } from '@activepieces/core-utils'
import { ApplicationEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { applicationEvents } from '../../helper/application-events'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { AuditEventEntity } from './audit-event-entity'

export const auditLogRepo = repoFactory(AuditEventEntity)

function emitAuditEventToEvlog(event: ApplicationEvent): void {
    const actor = event.userId
        ? { type: 'user' as const, id: event.userId, email: event.userEmail }
        : { type: 'system' as const, id: event.platformId }
    const auditInput: AuditEventInput = {
        action: event.action,
        actor,
        target: {
            type: event.projectId ? 'project' : 'platform',
            id: event.projectId ?? event.platformId,
            data: event.data,
        },
    }
    tryCatchSync(() => auditEvent(auditInput))
}

export const auditLogService = (log: FastifyBaseLogger) => ({
    setup(): void {
        applicationEvents(log).registerListeners(log, {
            userEvent: (log) => async (params) => {
                rejectedPromiseHandler(auditLogRepo().save(params), log)
                emitAuditEventToEvlog(params)
            },
            workerEvent: (log) => async (_projectId, params) => {
                rejectedPromiseHandler(auditLogRepo().save(params), log)
                emitAuditEventToEvlog(params)
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
