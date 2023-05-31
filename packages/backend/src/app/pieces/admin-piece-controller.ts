import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { pieceMetadataService } from './piece-metadata-service'
import { CreatePieceRequest } from './admin-piece-requests'
import { PieceMetadataSchema } from './piece-metadata-entity'
import { PieceMetadata } from '@activepieces/pieces-framework'

export const adminPieceController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', CreatePieceRequest, async (req): Promise<PieceMetadataSchema> => {
        return await pieceMetadataService.create({
            pieceMetadata: req.body as PieceMetadata,
        })
    })

    done()
}
