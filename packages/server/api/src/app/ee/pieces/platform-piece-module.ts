import {
    FastifyPluginAsyncTypebox,
    FastifyPluginCallbackTypebox,
    Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { pieceService } from '../../pieces/piece-service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import {
    ActivepiecesError,
    AddPieceRequestBody,
    EndpointScope,
    ErrorCode,
    PieceScope,
    Principal,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'

export const platformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformPieceController, { prefix: '/v1/pieces' })
}

const platformPieceController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {


    app.post('/', installPieceParams, async (req, reply) => {
        const platformId = req.principal.platform.id
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
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
