import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { AddPieceRequestBody, PackageType, PieceScope, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod, FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { attachMultipartFieldsToBody } from '../../helper/multipart-body'
import { pieceInstallService } from '../../pieces/piece-install-service'
import { planFeatures } from '../../platform/plan-features'

export const platformPieceModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformPieceController, { prefix: '/v1/pieces' })
}

const platformPieceController: FastifyPluginCallbackZod = (
    app,
    _opts,
    done,
) => {

    app.post('/', installPieceParams, async (req, reply) => {
        const platformId = req.principal.platform.id
        assertOneOfTheseScope(req.body.scope, [PieceScope.PLATFORM])
        if (req.body.packageType === PackageType.ARCHIVE) {
            await planFeatures(req.log).assertEnabled({
                platformId,
                feature: 'managePiecesEnabled',
                message: 'Private pieces are not on this platform\'s plan',
            })
        }
        await pieceInstallService(req.log).installPiece(
            platformId,
            req.body,
        )
        await reply.status(StatusCodes.CREATED).send({})
    },
    )
    done()
}


const installPieceParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    preValidation: attachMultipartFieldsToBody,
    schema: {
        tags: ['pieces'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Add a piece to a platform',
        description: 'Add a piece to a platform',
        body: AddPieceRequestBody,
        response: {
            [StatusCodes.CREATED]: z.object({}),
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
