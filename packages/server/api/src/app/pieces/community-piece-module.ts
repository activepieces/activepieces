import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { AddPieceRequestBody, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { pieceInstallService } from './piece-install-service'

export const communityPiecesModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(communityPiecesController, { prefix: '/v1/pieces' })
}

const communityPiecesController: FastifyPluginAsyncTypebox = async (app) => {
    app.post(
        '/',
        {
            config: {
                security: securityAccess.project([PrincipalType.USER], undefined, {
                    type: ProjectResourceType.BODY,
                }),
            },
            schema: {
                body: AddPieceRequestBody,
            },
        },
        async (req, res): Promise<PieceMetadataModel> => {
            const platformId = req.principal.platform.id
            const projectId = req.projectId
            const pieceMetadata = await pieceInstallService(req.log).installPiece(
                platformId,
                projectId,
                req.body,
            )
            return res.code(StatusCodes.CREATED).send(pieceMetadata)
        },
    )
}
