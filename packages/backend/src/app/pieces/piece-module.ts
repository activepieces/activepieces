import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { piecesController } from './pieces.controller'

export const pieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(piecesController, { prefix: '/v1/pieces' })
}
