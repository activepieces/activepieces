import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { pieceService } from './piece-service'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { AddPieceRequestBody, PrincipalType } from '@activepieces/shared'

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
