import { isNil } from '@activepieces/core-utils'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { pieceUpgradeService } from './piece-upgrade.service'

export const pieceUpgradeModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', checkAdminApiKeyPreHandler)
    await app.register(pieceUpgradeController, { prefix: '/v1/admin/flows' })
}

const pieceUpgradeController: FastifyPluginAsyncZod = async (app) => {
    app.post('/upgrade-pieces', UpgradeFlowPiecesRequest, async (req) => {
        return pieceUpgradeService(req.log).upgradeFlows(req.body)
    })

    app.post('/revert-upgrade', RevertFlowPiecesRequest, async (req) => {
        return pieceUpgradeService(req.log).revertFlows(req.body)
    })
}

async function checkAdminApiKeyPreHandler(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const apiKey = system.get(AppSystemProp.API_KEY)
    const requestKey = req.headers['api-key']
    if (isNil(apiKey) || requestKey !== apiKey) {
        await res.status(StatusCodes.FORBIDDEN).send({ message: 'Forbidden' })
        throw new Error('Forbidden')
    }
}

const UpgradeFlowPiecesRequest = {
    schema: {
        body: z.object({
            flowIds: z.array(z.string()).min(1),
            projectId: z.string().optional(),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}

const RevertFlowPiecesRequest = {
    schema: {
        body: z.object({
            flowIds: z.array(z.string()).min(1),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}
