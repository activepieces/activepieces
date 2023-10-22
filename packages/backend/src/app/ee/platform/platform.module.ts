import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformController } from './platform.controller'
import { adminPlatformController } from './admin-platform.controller'

export const platformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformController, { prefix: '/v1/platform' })
    await app.register(adminPlatformController, { prefix: '/v1/admin/platform' })
}
