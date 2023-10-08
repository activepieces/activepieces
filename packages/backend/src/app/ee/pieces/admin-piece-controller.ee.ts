import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { CreatePieceRequest } from './admin-piece-requests.ee'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { PackageType, PieceType } from '@activepieces/shared'
import { PieceMetadataModel } from '../../pieces/piece-metadata-entity'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'

export const adminPieceController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', CreatePieceRequest, async (req): Promise<PieceMetadataModel> => {
        return await pieceMetadataService.create({
            pieceMetadata: req.body as PieceMetadata,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
    })

    done()
}
