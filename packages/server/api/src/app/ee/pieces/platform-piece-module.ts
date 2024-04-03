import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import {
    ActivepiecesError,
    AddPieceRequestBody,
    EndpointScope,
    ErrorCode,
    PieceScope,
    PlatformRole,
    Principal,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    SetPieceTagsRequest,
} from '@activepieces/shared'
import { pieceService } from '../../pieces/piece-service'
import { StatusCodes } from 'http-status-codes'
import { tagService } from '../../tags/tag-service'

export const platformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformPieceController, { prefix: '/v1/pieces' })
}

const platformPieceController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {

    app.post('/tags', setPiecesTagsParams, async (req, reply) => {
        const platformId = req.principal.platform.id
        const pieces = req.body.piecesName.map(pieceName => tagService.setPieceTags(platformId, pieceName, req.body.tags))
        await Promise.all(pieces)
        await reply.status(StatusCodes.CREATED).send({})
    },)


    app.post('/', installPieceParams, async (req, reply) => {
        const platformId = req.principal.platform.id
        assertPrincipalIsPlatformOwner(req.body.scope, req.principal)
        assertProjectScopeOnlyAllowedForUser(req.body.scope, req.principal)
        await pieceService.installPiece(
            platformId,
            req.principal.projectId,
            req.body,
        )
        await reply.status(StatusCodes.CREATED).send({})
    },
    )

    done()
}

const setPiecesTagsParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        body: SetPieceTagsRequest,
        response: {
            [StatusCodes.CREATED]: Type.Object({})
        },
    },
}
const installPieceParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['pieces'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Add a piece to a platform',
        description: 'Add a piece to a platform',
        body: AddPieceRequestBody,
        response: {
            [StatusCodes.CREATED]: Type.Object({}),
        },
    },
}

function assertPrincipalIsPlatformOwner(
    scope: PieceScope,
    principal: Principal,
): void {
    if (scope == PieceScope.PLATFORM) {
        if (principal.platform.role !== PlatformRole.OWNER) {
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: {
                    message: 'Principal is not platform owner',
                },
            })
        }
    }
}

function assertProjectScopeOnlyAllowedForUser(
    scope: PieceScope,
    principal: Principal,
): void {
    if (scope === PieceScope.PROJECT && principal.type !== PrincipalType.USER) {
        throw new ActivepiecesError({
            code: ErrorCode.ENGINE_OPERATION_FAILURE,
            params: {
                message: 'Project scope is only allowed for user token',
            },
        })
    }
}
