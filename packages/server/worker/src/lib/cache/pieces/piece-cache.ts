import path from 'path'
import { trace } from '@opentelemetry/api'
import { ApEnvironment, EXACT_VERSION_REGEX, PackageType, PiecePackage, PieceType } from '@activepieces/shared'
import { apiClient } from '../../api/api-client'
import { system, WorkerSystemProp } from '../../config/configs'
import { Logger } from 'pino'
import { workerSettings } from '../../config/worker-settings'
import { cacheState, NO_SAVE_GUARD } from '../cache-state'
import { GLOBAL_CACHE_PIECES_PATH } from '../cache-paths'

const tracer = trace.getTracer('piece-cache')

export const pieceCache = (log: Logger) => ({
    async getPiece({ pieceName, pieceVersion, platformId }: PieceCacheKey): Promise<PiecePackage> {
        const isExactVersion = EXACT_VERSION_REGEX.test(pieceVersion)

        if (!isExactVersion) {
            return getPiecePackage({ pieceName, pieceVersion, platformId })
        }

        const cacheKey = `${pieceName}-${pieceVersion}-${platformId}`
        const cache = cacheState(path.join(GLOBAL_CACHE_PIECES_PATH, cacheKey))

        const { state } = await cache.getOrSetCache({
            key: cacheKey,
            cacheMiss: (_: string) => {
                const environment = workerSettings.getSettings().ENVIRONMENT
                if (environment === ApEnvironment.TESTING) {
                    return true
                }
                const devPieces = workerSettings.getSettings().DEV_PIECES
                if (devPieces.includes(pieceName)) {
                    return true
                }
                return false
            },
            installFn: async () => {
                return tracer.startActiveSpan('pieceCache.fetchPiece', async (span) => {
                    try {
                        span.setAttribute('piece.name', pieceName)
                        span.setAttribute('piece.version', pieceVersion)
                        const piecePackage = await getPiecePackage({ pieceName, pieceVersion, platformId })
                        log.info({ pieceName, pieceVersion, platformId }, 'Cached piece')
                        return JSON.stringify(piecePackage)
                    }
                    finally {
                        span.end()
                    }
                })
            },
            skipSave: NO_SAVE_GUARD,
        })

        return JSON.parse(state as string) as PiecePackage
    },
})

async function getPiecePackage(query: PieceCacheKey): Promise<PiecePackage> {
    const apiUrl = system.getOrThrow(WorkerSystemProp.API_URL)
    const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)
    const pieceMetadata = await apiClient.getPiece(apiUrl, workerToken, query.pieceName, {
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

type PieceCacheKey = {
    pieceName: string
    pieceVersion: string
    platformId: string
}
