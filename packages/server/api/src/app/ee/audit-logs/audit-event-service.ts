import Ajv from 'ajv'
import { FastifyRequest } from 'fastify'
import { databaseConnection } from '../../database/database-connection'
import { AuditEventParam } from '../../helper/application-events'
import { extractClientRealIp } from '../../helper/network-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { AuditEventEntity } from './audit-event-entity'
import {
    ApplicationEvent,
} from '@activepieces/ee-shared'
import { logger, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    apId,
    assertEqual,
    Cursor,
    PrincipalType,
    SeekPage,
} from '@activepieces/shared'

const auditLogRepo = databaseConnection.getRepository(AuditEventEntity)

const ajv = new Ajv({ removeAdditional: 'all' })
const eventSchema = ajv.compile<ApplicationEvent>(ApplicationEvent)

export const auditLogService = {
    sendUserEvent(request: FastifyRequest, params: AuditEventParam): void {
        if ([PrincipalType.UNKNOWN, PrincipalType.WORKER].includes(request.principal.type)) {
            return
        }
        rejectedPromiseHandler(saveEvent({
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            userId: request.principal.id,
            ip: extractClientRealIp(request),
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
    async list({ platformId, cursorRequest, limit }: ListParams): Promise<SeekPage<ApplicationEvent>> {
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
        const paginationResponse = await paginator.paginate(
            auditLogRepo.createQueryBuilder('audit_event')
                .where({ platformId }),
        )
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
        projectId: info.projectId,
        platformId: info.platformId,
        ip: info.ip,
        data: {
            ...rawEvent.data,
            project,
            user,
        },
        action: rawEvent.action,
    }
    const valid = eventSchema(eventToSave)
    assertEqual(valid, true, 'Event validation', 'true')
    const appEvent = await auditLogRepo.save(eventToSave as ApplicationEvent)
    logger.info(appEvent, '[AuditEventService#saveEvent] Audit event saved')
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
}