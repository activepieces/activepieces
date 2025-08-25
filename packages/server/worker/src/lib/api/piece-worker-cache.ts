import path from 'path'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { GLOBAL_CACHE_PIECES_PATH, PiecesSource } from '@activepieces/server-shared'
import { isNil, PieceType, ProjectId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { cacheState } from '../cache/cache-state'
import { workerMachine } from '../utils/machine'
import { engineApiService } from './server-api.service'


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
        const cacheKey = getCacheKey({ pieceName, pieceVersion, projectId, pieceType: piece.pieceType })
        const pieceCache = getCacheForPiece(cacheKey)
        await pieceCache.setCache(cacheKey, JSON.stringify(piece))
    },
})

async function getPieceFromCache({ pieceName, pieceVersion, projectId }: GetPieceRequestQueryWorker): Promise<PieceMetadataModel | null> {
    const piecesSource = workerMachine.getSettings().PIECES_SOURCE
    if (piecesSource === PiecesSource.FILE) {
        return null
    }
    try {
        for (const pieceType of [PieceType.CUSTOM, PieceType.OFFICIAL]) {
            const cacheKey = getCacheKey({ pieceName, pieceVersion, projectId, pieceType })
            const pieceCache = getCacheForPiece(cacheKey)
            const cachedPiece = await pieceCache.cacheCheckState(cacheKey)
            if (!isNil(cachedPiece)) {
                return JSON.parse(cachedPiece) as PieceMetadataModel
            }
        }
        return null
    }
    catch (error) {
        return null
    }
}

function getCacheKey({ pieceName, pieceVersion, projectId, pieceType }: PieceCacheKeyWithType) {
    switch (pieceType) {
        case PieceType.OFFICIAL:
            return `${pieceName}-${pieceVersion}`
        case PieceType.CUSTOM:
            return `${pieceName}-${pieceVersion}-${projectId}`
    }
}

type GetPieceRequestQueryWorker = PieceCacheKey & {
    engineToken: string
}

type PieceCacheKey = {
    pieceName: string
    pieceVersion: string
    projectId: ProjectId
}

type PieceCacheKeyWithType = PieceCacheKey & {
    pieceType: PieceType
}

function getCacheForPiece(cacheKey: string) {
    return cacheState(path.join(GLOBAL_CACHE_PIECES_PATH, cacheKey))
} 