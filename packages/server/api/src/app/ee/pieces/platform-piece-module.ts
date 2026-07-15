import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { AddPieceRequestBody, BulkUpgradePieceVersionRequestBody, BulkUpgradePieceVersionResponse, PieceScope, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod, FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { pieceInstallService } from '../../pieces/piece-install-service'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { bulkUpgradePieceVersionService } from './bulk-upgrade-piece-version.service'

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
        await pieceInstallService(req.log).installPiece(
            platformId,
            req.body,
        )
        await reply.status(StatusCodes.CREATED).send({})
    },
    )

    app.post('/bulk-upgrade-version', bulkUpgradeVersionParams, async (req) => {
        return bulkUpgradePieceVersionService(req.log).run({
            platformId: req.principal.platform.id,
            userId: req.principal.type === PrincipalType.USER ? req.principal.id : null,
            request: req.body,
        })
    })
    done()
}

const bulkUpgradeVersionParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    preHandler: platformMustHaveFeatureEnabled((platform) => platform.plan.managePiecesEnabled),
    schema: {
        tags: ['pieces'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        summary: 'Bulk upgrade a piece to a target version across a platform\'s flows',
        description: 'Upgrade every flow that pins an older version of the piece. Flows that stay valid are republished automatically (preserving their enabled state); flows that would need new configuration are reported and left untouched. Set dryRun to preview without applying.',
        body: BulkUpgradePieceVersionRequestBody,
        response: {
            [StatusCodes.OK]: BulkUpgradePieceVersionResponse,
        },
    },
}


const installPieceParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
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
