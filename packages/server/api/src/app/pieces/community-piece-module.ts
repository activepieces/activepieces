import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { AddPieceRequestBody, PrincipalType } from '@activepieces/shared'
import { pieceService } from './piece-service'
import { PieceMetadataModel } from './piece-metadata-entity'
import { StatusCodes } from 'http-status-codes'

export const communityPiecesModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(communityPiecesController, { prefix: '/v1/pieces' })
}

const communityPiecesController: FastifyPluginAsyncTypebox = async (app) => {
    app.post(
        '/',
        {
            config: {
                allowedPrincipals: [PrincipalType.USER],
            },
            schema: {
                body: AddPieceRequestBody,
            },
        },
        async (req, res): Promise<PieceMetadataModel> => {
            const platformId = req.principal.platform.id
            const projectId = req.principal.projectId
            const pieceMetadata = await pieceService.installPiece(
                platformId,
                projectId,
                req.body,
            )
            return res.code(StatusCodes.CREATED).send(pieceMetadata)
        },
    )
}
