import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { pieceSetController, pieceSetProjectController } from './piece-set.controller'

export const pieceSetModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(pieceSetProjectController, { prefix: '/v1/piece-sets' })

    await app.register(async (adminApp) => {
        adminApp.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.managePiecesEnabled))
        await adminApp.register(pieceSetController, { prefix: '/v1/piece-sets' })
    })
}
