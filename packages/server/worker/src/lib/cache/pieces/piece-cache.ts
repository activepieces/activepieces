import path from 'path'
import { type ApLogger, wideEvent } from '@activepieces/server-utils'
import { ApEnvironment, EXACT_VERSION_REGEX, PackageType, PiecePackage, PieceType, WorkerToApiContract } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { getGlobalCachePiecesPath } from '../cache-paths'
import { cacheState, NO_SAVE_GUARD } from '../cache-state'

export const pieceCache = (log: ApLogger, apiClient: WorkerToApiContract) => ({
    async getPiece({ pieceName, pieceVersion, platformId }: PieceCacheKey): Promise<PiecePackage> {
        const isExactVersion = EXACT_VERSION_REGEX.test(pieceVersion)

        if (!isExactVersion) {
            return getPiecePackage({ pieceName, pieceVersion, platformId }, apiClient)
        }

        const cacheKey = `${pieceName}-${pieceVersion}-${platformId}`
        const cache = cacheState(path.join(getGlobalCachePiecesPath(), cacheKey))

        const { state, cacheHit } = await cache.getOrSetCache({
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
                return wideEvent.timed({
                    name: 'pieceFetch',
                    fn: async () => {
                        const piecePackage = await getPiecePackage({ pieceName, pieceVersion, platformId }, apiClient)
                        log.info({ pieceName, pieceVersion, platformId }, 'Cached piece')
                        return JSON.stringify(piecePackage)
                    },
                })
            },
            skipSave: NO_SAVE_GUARD,
        })

        wideEvent.set({ pieceCacheHit: cacheHit })

        return JSON.parse(state as string) as PiecePackage
    },
})

async function getPiecePackage(query: PieceCacheKey, apiClient: WorkerToApiContract): Promise<PiecePackage> {
    const pieceMetadata = await apiClient.getPiece({
        name: query.pieceName,
        version: query.pieceVersion,
        platformId: query.platformId,
    }) as { packageType: PackageType, name: string, version: string, pieceType: PieceType, archiveId?: string } | null

    if (!pieceMetadata) {
        throw new PieceNotFoundError(query.pieceName, query.pieceVersion)
    }

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

export class PieceNotFoundError extends Error {
    constructor(pieceName: string, pieceVersion: string) {
        super(`Piece metadata not found for ${pieceName}@${pieceVersion}`)
        this.name = 'PieceNotFoundError'
    }
}

type PieceCacheKey = {
    pieceName: string
    pieceVersion: string
    platformId: string
}
