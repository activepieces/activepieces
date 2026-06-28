import { isNil } from '@activepieces/core-utils'
import { ApEnvironment, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { loadDevPiecesIfEnabled } from './utils'

const repo = repoFactory(PieceMetadataEntity)
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === ApEnvironment.TESTING

let cachedRegistry: PieceRegistryEntry[] | null = null
let registryGeneration = 0

// An exact piece version (name:version:platformId) is immutable, so its full metadata can be cached
// for the process lifetime. The only writers (create/delete/bulkDelete) call invalidate(), which clears
// this cache locally and via pubsub on every instance — same invalidation path as the registry above.
// Piece metadata rows are heavy (actions+triggers+props+i18n), so it's an LRU-capped cache: on a shared
// multi-tenant pod touching many platforms' pieces an unbounded map would grow without limit; the LRU
// keeps the hot working set resident (flows reuse the same few versions) and bounds worst-case footprint.
// ttl 0 = no expiry (immutable data); eviction is purely by the entry cap.
const MAX_CACHED_PIECE_VERSIONS = 1000
const cachedVersions: LRU<PieceMetadataSchema> = lru(MAX_CACHED_PIECE_VERSIONS, 0)

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            log.info('[pieceCache] Registry cache initialized')
            if (!isTestingEnvironment) {
                await pubsub.subscribe(PIECE_REGISTRY_INVALIDATION_CHANNEL, () => {
                    cachedRegistry = null
                    cachedVersions.clear()
                    registryGeneration++
                    log.debug('[pieceCache] Registry invalidated via pubsub')
                })
            }
        },

        async loadRegistry(): Promise<PieceRegistryEntry[]> {
            const persistedRegistry = await loadPersistedRegistry()
            const devPieces = (await loadDevPiecesIfEnabled(log)).map(toRegistryEntry)
            return [...persistedRegistry, ...devPieces]
        },

        getCachedVersion(key: string): PieceMetadataSchema | undefined {
            return cachedVersions.get(key)
        },

        setCachedVersion(key: string, value: PieceMetadataSchema): void {
            cachedVersions.set(key, value)
        },

        async invalidate(): Promise<void> {
            cachedRegistry = null
            cachedVersions.clear()
            registryGeneration++
            if (!isTestingEnvironment) {
                await pubsub.publish(PIECE_REGISTRY_INVALIDATION_CHANNEL, '1')
            }
        },
    }
}

async function loadPersistedRegistry(): Promise<PieceRegistryEntry[]> {
    if (isTestingEnvironment) {
        return fetchRegistryFromDB()
    }
    if (!isNil(cachedRegistry)) {
        return cachedRegistry
    }
    const startGeneration = registryGeneration
    const result = await fetchRegistryFromDB()
    if (registryGeneration !== startGeneration) {
        return loadPersistedRegistry()
    }
    cachedRegistry = result
    return result
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

export const PIECE_REGISTRY_INVALIDATION_CHANNEL = 'piece-registry-invalidation'

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}
