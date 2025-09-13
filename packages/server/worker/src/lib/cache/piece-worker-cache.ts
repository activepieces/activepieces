import path from 'path'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { AppSystemProp, environmentVariables, PiecesSource } from '@activepieces/server-shared'
import { ApEnvironment, isNil, ProjectId } from '@activepieces/shared'
import { engineApiService } from '../api/server-api.service'
import { workerMachine } from '../utils/machine'
import { cacheState } from './cache-state'
import { GLOBAL_CACHE_PIECES_PATH } from './worker-cache'


export const pieceWorkerCache = {
    async getPiece({ engineToken, pieceName, pieceVersion, projectId }: GetPieceRequestQueryWorker): Promise<PieceMetadataModel> {
        const piece = await getPieceFromCache({ engineToken, pieceName, pieceVersion, projectId })
        if (!isNil(piece)) {
            return piece
        }
        const pieceMetadata = await engineApiService(engineToken).getPiece(pieceName, {
            version: pieceVersion,
        })
        await this.writePieceToCacheIfCachable({ pieceName, pieceVersion, projectId }, pieceMetadata)
        return pieceMetadata
    },
    async writePieceToCacheIfCachable({ pieceName, pieceVersion, projectId }: PieceCacheKey, piece: PieceMetadataModel): Promise<void> {
        const cacheKey = getCacheKey({ pieceName, pieceVersion, projectId })
        const pieceCache = getCacheForPiece(cacheKey)
        await pieceCache.setCache(cacheKey, JSON.stringify(piece))
    },
}

async function getPieceFromCache({ pieceName, pieceVersion, projectId }: GetPieceRequestQueryWorker): Promise<PieceMetadataModel | null> {
    if (skipCache()) {
        return null
    }
    try {
        const cacheKey = getCacheKey({ pieceName, pieceVersion, projectId })
        const pieceCache = getCacheForPiece(cacheKey)
        const cachedPiece = await pieceCache.cacheCheckState(cacheKey)
        if (!isNil(cachedPiece)) {
            return JSON.parse(cachedPiece) as PieceMetadataModel
        }
        return null
    }
    catch (error) {
        return null
    }
}

function skipCache() {
    const environment = environmentVariables.getEnvironment(AppSystemProp.ENVIRONMENT)
    if (environment === ApEnvironment.TESTING) {
        return true
    }
    const piecesSource = workerMachine.getSettings().PIECES_SOURCE
    if (piecesSource === PiecesSource.FILE) {
        return true
    }
    return false
}

function getCacheKey({ pieceName, pieceVersion, projectId }: PieceCacheKeyWithType) {
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

type PieceCacheKeyWithType = PieceCacheKey

function getCacheForPiece(cacheKey: string) {
    return cacheState(path.join(GLOBAL_CACHE_PIECES_PATH, cacheKey))
} 