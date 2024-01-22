import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { adminPlatformController } from './admin-platform.controller'
import { platformController } from '../../platform/platform.controller'

export const platformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
    await app.register(platformController, { prefix: '/v1/platforms' })
}
