import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { CreatePieceRequest } from './admin-piece-requests.ee'
import { PieceMetadata } from '@activepieces/pieces-framework'

export const adminPieceController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', CreatePieceRequest, async (req): Promise<PieceMetadata> => {
        return await pieceMetadataService.create({
            projectId: null,
            pieceMetadata: req.body as PieceMetadata,
        })
    })

    done()
}
