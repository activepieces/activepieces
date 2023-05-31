import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { piecesController } from './pieces.controller'
import { adminPieceController } from './admin-piece-controller'

export const pieceModule: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.register(piecesController, { prefix: '/v1/pieces' })
    app.register(adminPieceController, { prefix: '/v1/pieces' })

    done()
}
