import path from 'path'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { PiecesSource } from '@activepieces/server-shared'
import { isNil, ProjectId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { cacheState } from '../cache/cache-state'
import { workerMachine } from '../utils/machine'
import { engineApiService } from './server-api.service'

const globalCachePiecePath = path.resolve('cache', 'pieces')

export const pieceWorkerCache = (log: FastifyBaseLogger) => ({
    async getPiece({ engineToken, pieceName, pieceVersion, projectId }: GetPieceRequestQueryWorker): Promise<PieceMetadataModel> {
        const piece = await getPieceFromCache({ engineToken, pieceName, pieceVersion, projectId })
        if (!isNil(piece)) {
            return piece
        }
        const pieceMetadata = await engineApiService(engineToken, log).getPiece(pieceName, {
            version: pieceVersion,
        })
        await this.writePieceToCacheIfCachable({ pieceName, pieceVersion, projectId }, pieceMetadata)
        return pieceMetadata
    },
    async writePieceToCacheIfCachable({ pieceName, pieceVersion, projectId }: PieceCacheKey, piece: PieceMetadataModel): Promise<void> {
        const pieceCache = getCacheForPiece({ pieceName, pieceVersion, projectId })
        await pieceCache.setCache(getCacheKeyForPiece({ pieceName, pieceVersion, projectId }), JSON.stringify(piece))
    },
})

async function getPieceFromCache({ pieceName, pieceVersion, projectId }: GetPieceRequestQueryWorker): Promise<PieceMetadataModel | null> {
    const piecesSource = workerMachine.getSettings().PIECES_SOURCE
    if (piecesSource === PiecesSource.FILE) {
        return null
    }
    try {
        const pieceCache = getCacheForPiece({ pieceName, pieceVersion, projectId })
        const cachedPiece = await pieceCache.cacheCheckState(getCacheKeyForPiece({ pieceName, pieceVersion, projectId }))
        return cachedPiece ? JSON.parse(cachedPiece) as PieceMetadataModel : null
    }
    catch (error) {
        return null
    }
}

function getCacheKeyForPiece({ pieceName, pieceVersion, projectId }: PieceCacheKey) {
    return `${pieceName}-${pieceVersion}-${projectId}`
}

type GetPieceRequestQueryWorker = PieceCacheKey & {
    engineToken: string
}

type PieceCacheKey = {
    pieceName: string
    pieceVersion: string
    projectId: ProjectId
}

function getCacheForPiece({ pieceName, pieceVersion, projectId }: PieceCacheKey) {
    return cacheState(path.join(globalCachePiecePath, getCacheKeyForPiece({ pieceName, pieceVersion, projectId })))
} 