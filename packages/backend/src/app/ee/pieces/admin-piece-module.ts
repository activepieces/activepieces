import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { adminPieceController } from './admin-piece-controller.ee'

export const adminPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPieceController, { prefix: '/v1/admin/pieces' })
}
