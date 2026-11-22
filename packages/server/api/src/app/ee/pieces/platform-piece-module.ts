import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { AddPieceRequestBody, ApEdition, PieceScope, PlanName, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod, FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { attachMultipartFieldsToBody } from '../../helper/multipart-body'
import { system } from '../../helper/system/system'
import { pieceInstallService } from '../../pieces/piece-install-service'

export const platformPieceModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => planAllowsCustomPieces(platform.plan.plan)))
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

function planAllowsCustomPieces(plan: string | null | undefined): boolean {
    if (system.getEdition() !== ApEdition.CLOUD || isNil(plan)) {
        return true
    }
    return !PLANS_WITHOUT_CUSTOM_PIECES.includes(plan)
}

const PLANS_WITHOUT_CUSTOM_PIECES: string[] = [PlanName.FREE, PlanName.FREE_LEGACY]
