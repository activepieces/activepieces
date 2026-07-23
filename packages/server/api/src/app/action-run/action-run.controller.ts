import { ApId, OptionalArrayFromQuery, OptionalBooleanFromQuery, Permission, SeekPage } from '@activepieces/core-utils'
import { ActionRunListItem, ActionRunSource, BulkArchiveActionRunsRequestBody, FlowRunStatus, PopulatedActionRun, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { ActionRunEntity } from './action-run.entity'
import { actionRunService } from './action-run.service'

const DEFAULT_PAGING_LIMIT = 10

export const actionRunController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListRequest, async (request) => {
        return actionRunService(request.log).list({
            projectId: request.query.projectId,
            cursor: request.query.cursor ?? null,
            limit: Number(request.query.limit ?? DEFAULT_PAGING_LIMIT),
            status: request.query.status,
            source: request.query.source,
            userId: request.query.userId,
            createdAfter: request.query.createdAfter,
            createdBefore: request.query.createdBefore,
            includeArchived: request.query.includeArchived,
        })
    })

    app.get('/:id', GetRequest, async (request) => {
        return actionRunService(request.log).getOneOrThrow({
            projectId: request.projectId,
            id: request.params.id,
            includeArchived: request.query.includeArchived,
        })
    })

    app.post('/archive', ArchiveRequest, async (request) => {
        return actionRunService(request.log).bulkArchive({
            projectId: request.projectId,
            actionRunIds: request.body.actionRunIds,
            excludeActionRunIds: request.body.excludeActionRunIds,
            status: request.body.status,
            source: request.body.source,
            userId: request.body.userId,
            createdAfter: request.body.createdAfter,
            createdBefore: request.body.createdBefore,
        })
    })
}

const ListRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_RUN, {
                type: ProjectResourceType.QUERY,
            }),
    },
    schema: {
        tags: ['action-runs'],
        description: 'List action runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({
            projectId: ApId,
            cursor: z.string().optional(),
            limit: z.coerce.number().optional(),
            status: OptionalArrayFromQuery(z.enum(FlowRunStatus)),
            source: OptionalArrayFromQuery(z.enum(ActionRunSource)),
            userId: OptionalArrayFromQuery(ApId),
            createdAfter: z.string().optional(),
            createdBefore: z.string().optional(),
            includeArchived: OptionalBooleanFromQuery,
        }),
        response: {
            [StatusCodes.OK]: SeekPage(ActionRunListItem),
        },
    },
}

const GetRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_RUN, {
                type: ProjectResourceType.TABLE,
                tableName: ActionRunEntity,
            }),
    },
    schema: {
        tags: ['action-runs'],
        description: 'Get a action run',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            id: ApId,
        }),
        querystring: z.object({
            includeArchived: OptionalBooleanFromQuery,
        }),
        response: {
            [StatusCodes.OK]: PopulatedActionRun,
        },
    },
}

const ArchiveRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_RUN, {
                type: ProjectResourceType.BODY,
            }),
    },
    schema: {
        tags: ['action-runs'],
        description: 'Archive action runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: BulkArchiveActionRunsRequestBody,
    },
}
