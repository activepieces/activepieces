import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { ActivepiecesError, AddPieceRequestBody, ErrorCode, isNil } from '@activepieces/shared'
import { PieceMetadataModel } from '../../pieces/piece-metadata-entity'
import { platformService } from '../platform/platform.service'
import { pieceService } from '../../pieces/piece-service'


export const platformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformPieceController, { prefix: '/v1/pieces' })
}

const platformPieceController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', {
        schema: {
            body: AddPieceRequestBody,
        },
    }, async (req): Promise<PieceMetadataModel> => {
        const { platformId } = req.body
        const { packageType, pieceName, pieceVersion, pieceArchive } = req.body
        const { projectId } = req.principal
        await assertUserIsPlatformOwner({
            platformId,
            userId: req.principal.id,
        })
        return pieceService.installPiece({
            packageType,
            pieceName,
            pieceVersion,
            archive: pieceArchive as Buffer,
            projectId,
            platformId,
        })

    })

    done()
}

async function assertUserIsPlatformOwner({
    platformId,
    userId,
}: { platformId?: string, userId: string }): Promise<void> {
    if (!isNil(platformId)) {
        const userOwner = await platformService.checkUserIsOwner({
            platformId,
            userId,
        })
        if (!userOwner) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {},
            })
        }
    }
}