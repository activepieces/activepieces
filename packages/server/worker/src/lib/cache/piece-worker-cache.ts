import path from 'path'
import { AppSystemProp, environmentVariables } from '@activepieces/server-shared'
import { ApEnvironment, EXACT_VERSION_REGEX, PackageType, PiecePackage, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../api/server-api.service'
import { workerMachine } from '../utils/machine'
import { cacheState, NO_SAVE_GUARD } from './cache-state'
import { GLOBAL_CACHE_PIECES_PATH } from './worker-cache'


export const pieceWorkerCache = (log: FastifyBaseLogger) => ({
    async getPiece({ engineToken, pieceName, pieceVersion, platformId }: GetPieceRequestQueryWorker): Promise<PiecePackage> {
        const isExactVersion = EXACT_VERSION_REGEX.test(pieceVersion)

        const skipRelativeVersions = !isExactVersion
        if (skipRelativeVersions) {
            return getPiecePackage({ engineToken, pieceName, pieceVersion, platformId })
        }

        const cacheKey = `${pieceName}-${pieceVersion}-${platformId}`
        const cache = cacheState(path.join(GLOBAL_CACHE_PIECES_PATH, cacheKey), log)

        const { state } = await cache.getOrSetCache({
            key: cacheKey,
            cacheMiss: (_: string) => {
                const environment = environmentVariables.getEnvironment(AppSystemProp.ENVIRONMENT)
                if (environment === ApEnvironment.TESTING) {
                    return true
                }
                const devPieces = workerMachine.getSettings().DEV_PIECES
                if (devPieces.includes(pieceName)) {
                    return true
                }
                return false
            },
            installFn: async () => {
                const startTime = performance.now()

                const piecePackage = await getPiecePackage({ engineToken, pieceName, pieceVersion, platformId })
                log.info({
                    message: '[pieceWorkerCache] Cached piece',
                    pieceName,
                    pieceVersion,
                    platformId,
                    timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
                })

                return JSON.stringify(piecePackage)
            },
            skipSave: NO_SAVE_GUARD,
        })

        return JSON.parse(state as string) as PiecePackage
    },
})


async function getPiecePackage(query: GetPieceRequestQueryWorker): Promise<PiecePackage> {
    const pieceMetadata = await engineApiService(query.engineToken).getPiece(query.pieceName, {
        version: query.pieceVersion,
    })

    const baseProps = {
        packageType: pieceMetadata.packageType,
        pieceName: pieceMetadata.name,
        pieceVersion: pieceMetadata.version,
        pieceType: pieceMetadata.pieceType,
    }

    if (pieceMetadata.packageType === PackageType.ARCHIVE) {
        return {
            ...baseProps,
            archiveId: pieceMetadata.archiveId!,
            platformId: query.platformId,
        } as PiecePackage
    }

    if (pieceMetadata.pieceType === PieceType.CUSTOM) {
        return {
            ...baseProps,
            platformId: query.platformId,
        } as PiecePackage
    }

    return baseProps as PiecePackage
}


type GetPieceRequestQueryWorker = PieceCacheKey & {
    engineToken: string
}

type PieceCacheKey = {
    pieceName: string
    pieceVersion: string
    platformId: string
}
