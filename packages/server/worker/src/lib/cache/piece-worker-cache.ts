import path from 'path'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { AppSystemProp, environmentVariables, PiecesSource } from '@activepieces/server-shared'
import { ApEnvironment, ProjectId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../api/server-api.service'
import { workerMachine } from '../utils/machine'
import { cacheState, NO_SAVE_GUARD } from './cache-state'
import { GLOBAL_CACHE_PIECES_PATH } from './worker-cache'


export const pieceWorkerCache = (log: FastifyBaseLogger) => ({
    async getPiece({ engineToken, pieceName, pieceVersion, projectId }: GetPieceRequestQueryWorker): Promise<PieceMetadataModel> {
        const cacheKey = `${pieceName}-${pieceVersion}-${projectId}`
        const cache = cacheState(path.join(GLOBAL_CACHE_PIECES_PATH, cacheKey), log)

        const { state } = await cache.getOrSetCache({
            key: cacheKey,
            cacheMiss: (_: string) => {
                const environment = environmentVariables.getEnvironment(AppSystemProp.ENVIRONMENT)
                if (environment === ApEnvironment.TESTING) {
                    return true
                }
                const piecesSource = workerMachine.getSettings().PIECES_SOURCE
                if (piecesSource === PiecesSource.FILE) {
                    return true
                }
                return false        
            },
            installFn: async () => {
                const pieceMetadata = await engineApiService(engineToken).getPiece(pieceName, {
                    version: pieceVersion,
                })
                return JSON.stringify(pieceMetadata)
            },
            skipSave: NO_SAVE_GUARD,
        })
        const pieceMetadata = JSON.parse(state as string) as PieceMetadataModel
        return pieceMetadata
    },
})

type GetPieceRequestQueryWorker = PieceCacheKey & {
    engineToken: string
}

type PieceCacheKey = {
    pieceName: string
    pieceVersion: string
    projectId: ProjectId
}
