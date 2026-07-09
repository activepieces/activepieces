import { ApId, OptionalArrayFromQuery, OptionalBooleanFromQuery, Permission, SeekPage } from '@activepieces/core-utils'
import { AdhocRunListItem, AdhocRunSource, BulkArchiveAdhocRunsRequestBody, FlowRunStatus, PopulatedAdhocRun, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { AdhocRunEntity } from './adhoc-run.entity'
import { adhocRunService } from './adhoc-run.service'

const DEFAULT_PAGING_LIMIT = 10

export const adhocRunController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListRequest, async (request) => {
        return adhocRunService(request.log).list({
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
        return adhocRunService(request.log).getOneOrThrow({
            projectId: request.projectId,
            id: request.params.id,
        })
    })

    app.post('/archive', ArchiveRequest, async (request) => {
        return adhocRunService(request.log).bulkArchive({
            projectId: request.projectId,
            adhocRunIds: request.body.adhocRunIds,
            excludeAdhocRunIds: request.body.excludeAdhocRunIds,
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
        tags: ['adhoc-runs'],
        description: 'List ad-hoc piece/code runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({
            projectId: ApId,
            cursor: z.string().optional(),
            limit: z.coerce.number().optional(),
            status: OptionalArrayFromQuery(z.enum(FlowRunStatus)),
            source: OptionalArrayFromQuery(z.enum(AdhocRunSource)),
            userId: OptionalArrayFromQuery(ApId),
            createdAfter: z.string().optional(),
            createdBefore: z.string().optional(),
            includeArchived: OptionalBooleanFromQuery,
        }),
        response: {
            [StatusCodes.OK]: SeekPage(AdhocRunListItem),
        },
    },
}

const GetRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_RUN, {
                type: ProjectResourceType.TABLE,
                tableName: AdhocRunEntity,
            }),
    },
    schema: {
        tags: ['adhoc-runs'],
        description: 'Get an ad-hoc run',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: PopulatedAdhocRun,
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
        tags: ['adhoc-runs'],
        description: 'Archive ad-hoc piece/code runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: BulkArchiveAdhocRunsRequestBody,
    },
}
