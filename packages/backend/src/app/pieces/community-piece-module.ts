import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { AddPieceRequestBody } from '@activepieces/shared'
import { pieceService } from './piece-service'
import { PieceMetadataModel } from './piece-metadata-entity'

export const communityPiecesModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(communityPiecesController, { prefix: '/v1/pieces' })
}

const communityPiecesController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', {
        schema: {
            body: AddPieceRequestBody,
        },
    }, async (req, res): Promise<PieceMetadataModel> => {
        const { packageType, pieceName, pieceVersion, pieceArchive } = req.body
        const { projectId } = req.principal

        const pieceMetadata = await pieceService.installPiece({
            packageType,
            pieceName,
            pieceVersion,
            archive: pieceArchive as Buffer,
            projectId,
        })

        return res.code(201).send(pieceMetadata)
    })

}
