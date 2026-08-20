import path from 'path'
import { PieceMetadata, pieceTranslation } from '@activepieces/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteExtractPieceMetadataOperation,
} from '@activepieces/shared'
import { piecePath } from '../core/piece/piece-path'
import { pieceRunner } from '../core/piece/piece-runner'
import { EngineConstants } from '../handler/context/engine-constants'

export const pieceMetadataOperation = {
    extract: async (operation: ExecuteExtractPieceMetadataOperation): Promise<EngineResponse<PieceMetadata>>  => {
        const piece = {
            pieceName: operation.pieceName,
            pieceVersion: operation.pieceVersion,
            devPieces: EngineConstants.DEV_PIECES,
        }
        const { metadata } = await pieceRunner.describe(piece)
        const entryPath = await piecePath.resolve(piece)
        const i18n = await pieceTranslation.initializeI18n(path.dirname(path.dirname(entryPath)))
        return {
            status: EngineResponseStatus.OK,
            response: {
                ...metadata,
                name: operation.pieceName,
                version: operation.pieceVersion,
                i18n,
            },
        }
    },
}
