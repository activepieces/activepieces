import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { piecesController } from './pieces.controller'

export const pieceModule: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.register(piecesController, { prefix: '/v1/pieces' })

    done()
}
