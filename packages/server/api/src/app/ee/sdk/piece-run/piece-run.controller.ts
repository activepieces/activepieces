import { ApId, Permission, SeekPage } from '@activepieces/core-utils'
import {
    ListPieceRunsRequestQuery,
    PieceRun,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../../core/security/authorization/common'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { PieceRunEntity } from './piece-run.entity'
import { pieceRunService } from './piece-run.service'

export const pieceRunController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListPieceRunsConfig, async (request): Promise<SeekPage<PieceRun>> => {
        return pieceRunService(request.log).list({
            projectId: request.query.projectId,
            cursor: request.query.cursor ?? null,
            limit: request.query.limit,
            pieceName: request.query.pieceName,
            status: request.query.status,
        })
    })

    app.get('/:id', GetPieceRunConfig, async (request): Promise<PieceRun> => {
        return pieceRunService(request.log).getOneOrThrow({
            id: request.params.id,
            projectId: request.projectId,
        })
    })
}

const ListPieceRunsConfig = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_RUN, {
                type: ProjectResourceType.QUERY,
            }),
    },
    schema: {
        tags: ['piece-runs'],
        description: 'List the piece-action runs of a headless-SDK project.',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListPieceRunsRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(PieceRun),
        },
    },
}

const GetPieceRunConfig = {
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
        description: 'Get a single piece-action run.',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: PieceRun,
        },
    },
}
