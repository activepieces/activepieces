import { ApId, OptionalArrayFromQuery, OptionalBooleanFromQuery, Permission, SeekPage } from '@activepieces/core-utils'
import { BulkArchivePieceRunsRequestBody, FlowRunStatus, PieceRunListItem, PieceRunSource, PopulatedPieceRun, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { PieceRunEntity } from './piece-run.entity'
import { pieceRunService } from './piece-run.service'

const DEFAULT_PAGING_LIMIT = 10

export const pieceRunController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListRequest, async (request) => {
        return pieceRunService(request.log).list({
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
        return pieceRunService(request.log).getOneOrThrow({
            projectId: request.projectId,
            id: request.params.id,
            includeArchived: request.query.includeArchived,
        })
    })

    app.post('/archive', ArchiveRequest, async (request) => {
        return pieceRunService(request.log).bulkArchive({
            projectId: request.projectId,
            pieceRunIds: request.body.pieceRunIds,
            excludePieceRunIds: request.body.excludePieceRunIds,
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
        tags: ['piece-runs'],
        description: 'List piece runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({
            projectId: ApId,
            cursor: z.string().optional(),
            limit: z.coerce.number().optional(),
            status: OptionalArrayFromQuery(z.enum(FlowRunStatus)),
            source: OptionalArrayFromQuery(z.enum(PieceRunSource)),
            userId: OptionalArrayFromQuery(ApId),
            createdAfter: z.string().optional(),
            createdBefore: z.string().optional(),
            includeArchived: OptionalBooleanFromQuery,
        }),
        response: {
            [StatusCodes.OK]: SeekPage(PieceRunListItem),
        },
    },
}

const GetRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_RUN, {
                type: ProjectResourceType.TABLE,
                tableName: PieceRunEntity,
            }),
    },
    schema: {
        tags: ['piece-runs'],
        description: 'Get a piece run',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            id: ApId,
        }),
        querystring: z.object({
            includeArchived: OptionalBooleanFromQuery,
        }),
        response: {
            [StatusCodes.OK]: PopulatedPieceRun,
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
        tags: ['piece-runs'],
        description: 'Archive piece runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: BulkArchivePieceRunsRequestBody,
    },
}
