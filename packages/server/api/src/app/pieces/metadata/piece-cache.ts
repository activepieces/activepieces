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
const CACHE_VERSION_MAX_AGE_MS = 10 * 60 * 1000
const PIECE_CACHE_INVALIDATION_CHANNEL = 'piece-registry-invalidation'

let cacheVersion = 0
let cacheVersionStartedAt = performance.now()
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
                    advanceCacheVersion()
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
            advanceCacheVersion()
            if (!isTestingEnvironment) {
                await pubsub.publish(PIECE_CACHE_INVALIDATION_CHANNEL, INSTANCE_ID)
            }
        },
    }
}

export function currentPieceCacheVersion(): number {
    if (performance.now() - cacheVersionStartedAt > CACHE_VERSION_MAX_AGE_MS) {
        advanceCacheVersion()
        system.globalLogger().info({ pieceCache: { cacheVersion, maxAgeMs: CACHE_VERSION_MAX_AGE_MS } }, '[pieceCache] Max age reached, advanced the cache version')
    }
    return cacheVersion
}

function advanceCacheVersion(): void {
    cacheVersion++
    cacheVersionStartedAt = performance.now()
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
