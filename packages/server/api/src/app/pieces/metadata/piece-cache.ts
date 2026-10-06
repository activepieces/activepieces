import { apId } from '@activepieces/core-utils'
import { ApEnvironment, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { loadDevPiecesIfEnabled } from './utils'
import { createCacheVersionMemo } from './utils/cache-version-memo'

const repo = repoFactory(PieceMetadataEntity)
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === ApEnvironment.TESTING
const INSTANCE_ID = apId()
const PIECE_CACHE_VERSION_MAX_AGE_MS = 10 * 60 * 1000
const PIECE_CACHE_INVALIDATION_CHANNEL = 'piece-registry-invalidation'

let pieceCacheVersion = 0
let pieceCacheVersionStartedAt = performance.now()
const persistedRegistry = createCacheVersionMemo<PieceRegistryEntry[]>({ currentCacheVersion: currentPieceCacheVersion })

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            log.info('[pieceCache] Initialized')
            if (!isTestingEnvironment) {
                await pubsub.subscribe(PIECE_CACHE_INVALIDATION_CHANNEL, (sender) => {
                    if (sender === INSTANCE_ID) {
                        return
                    }
                    advancePieceCacheVersion()
                    log.debug('[pieceCache] Invalidated via pubsub')
                })
            }
        },

        async loadRegistry(): Promise<PieceRegistryEntry[]> {
            const persisted = isTestingEnvironment
                ? await fetchRegistryFromDB()
                : await persistedRegistry.get({ key: 'registry', load: fetchRegistryFromDB })
            const devPieces = (await loadDevPiecesIfEnabled(log)).map(toRegistryEntry)
            return [...persisted, ...devPieces]
        },

        async invalidate(): Promise<void> {
            advancePieceCacheVersion()
            if (!isTestingEnvironment) {
                await pubsub.publish(PIECE_CACHE_INVALIDATION_CHANNEL, INSTANCE_ID)
            }
        },
    }
}

export function currentPieceCacheVersion(): number {
    if (performance.now() - pieceCacheVersionStartedAt > PIECE_CACHE_VERSION_MAX_AGE_MS) {
        advancePieceCacheVersion()
        system.globalLogger().info({ pieceCache: { cacheVersion: pieceCacheVersion, maxAgeMs: PIECE_CACHE_VERSION_MAX_AGE_MS } }, '[pieceCache] Max age reached, advanced the cache version')
    }
    return pieceCacheVersion
}

function advancePieceCacheVersion(): void {
    pieceCacheVersion++
    pieceCacheVersionStartedAt = performance.now()
}

function toRegistryEntry(piece: PieceMetadataSchema): PieceRegistryEntry {
    return {
        name: piece.name,
        version: piece.version,
        minimumSupportedRelease: piece.minimumSupportedRelease,
        maximumSupportedRelease: piece.maximumSupportedRelease,
        platformId: piece.platformId,
        pieceType: piece.pieceType,
    }
}

async function fetchRegistryFromDB(): Promise<PieceRegistryEntry[]> {
    return repo()
        .createQueryBuilder('pm')
        .select(['pm."name"', 'pm."version"', 'pm."platformId"', 'pm."pieceType"', 'pm."minimumSupportedRelease"', 'pm."maximumSupportedRelease"'])
        .getRawMany<PieceRegistryEntry>()
}

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}
