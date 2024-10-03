import {
    ActivepiecesError,
    AddPieceRequestBody,
    EndpointScope,
    ErrorCode,
    PieceScope,
    Principal,
    PrincipalType,
    ProjectMemberRole,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { flagService } from '../../flags/flag.service'
import { pieceService } from '../../pieces/piece-service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { getPrincipalRoleOrThrow } from '../authentication/rbac/rbac-middleware'

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
        if (flagService.isCloudPlatform(platformId)) {
            assertOneOfTheseScope(req.body.scope, [PieceScope.PROJECT])
            await assertProjectAdminCanInstallPieceOnCloud(req.principal)
        }
        else {
            assertOneOfTheseScope(req.body.scope, [PieceScope.PLATFORM])
            await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        }
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

function assertOneOfTheseScope(
    scope: PieceScope,
    allowedScopes: PieceScope[],
): void {
    if (!allowedScopes.includes(scope)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Only project scope is allowed for cloud platform',
            },
        })
    }
}
async function assertProjectAdminCanInstallPieceOnCloud(
    principal: Principal,
): Promise<void> {
    const role = await getPrincipalRoleOrThrow(principal)
    if (role !== ProjectMemberRole.ADMIN) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Only platform admin can install a piece',
            },
        })
    }
}

