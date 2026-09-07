import { isNil, tryCatch } from '@activepieces/core-utils'
import { ApEnvironment, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
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

const LIST_TTL_MS = 60_000
const LIST_MAX_ENTRIES = 4
const LIST_MAX_PENDING = 4
const LIST_MAX_BYTES = 96 * 1024 * 1024
const cachedLists = new Map<string, { json: string, expiresAt: number }>()
const pendingLists = new Map<string, Promise<string>>()
let cachedListBytes = 0

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            log.info('[pieceCache] Registry cache initialized')
            if (!isTestingEnvironment) {
                await pubsub.subscribe(PIECE_REGISTRY_INVALIDATION_CHANNEL, () => {
                    invalidateLocalCache()
                    log.debug('[pieceCache] Registry invalidated via pubsub')
                })
            }
        },

        getGeneration: (): number => registryGeneration,
        loadList,

        async loadRegistry(): Promise<PieceRegistryEntry[]> {
            const persistedRegistry = await loadPersistedRegistry()
            const devPieces = (await loadDevPiecesIfEnabled(log)).map(toRegistryEntry)
            return [...persistedRegistry, ...devPieces]
        },

        async invalidate(): Promise<void> {
            invalidateLocalCache()
            if (!isTestingEnvironment) {
                await pubsub.publish(PIECE_REGISTRY_INVALIDATION_CHANNEL, '1')
            }
        },
    }
}

function invalidateLocalCache(): void {
    cachedRegistry = null
    registryGeneration++
    cachedLists.clear()
    cachedListBytes = 0
}

function removeList(key: string): void {
    const entry = cachedLists.get(key)
    if (entry) {
        cachedListBytes -= entry.json.length * 2
        cachedLists.delete(key)
    }
}

function storeList({ key, json }: { key: string, json: string }): void {
    const bytes = json.length * 2
    if (bytes > LIST_MAX_BYTES) {
        return
    }
    for (const [entryKey, entry] of cachedLists) {
        if (entry.expiresAt <= Date.now()) {
            removeList(entryKey)
        }
    }
    removeList(key)
    while (cachedLists.size >= LIST_MAX_ENTRIES || cachedListBytes + bytes > LIST_MAX_BYTES) {
        const oldestKey = cachedLists.keys().next().value
        if (isNil(oldestKey)) {
            return
        }
        removeList(oldestKey)
    }
    cachedLists.set(key, { json, expiresAt: Date.now() + LIST_TTL_MS })
    cachedListBytes += bytes
}

async function loadList({ key, loader }: LoadListParams): Promise<PieceMetadataSchema[]> {
    if (isTestingEnvironment || system.get(AppSystemProp.DEV_PIECES)) {
        return loader()
    }
    for (;;) {
        const generation = registryGeneration
        const cached = cachedLists.get(key)
        if (cached && cached.expiresAt > Date.now()) {
            cachedLists.delete(key)
            cachedLists.set(key, cached)
            return JSON.parse(cached.json)
        }
        removeList(key)
        const pendingKey = `${generation}:${key}`
        let pending = pendingLists.get(pendingKey)
        if (!pending) {
            if (pendingLists.size >= LIST_MAX_PENDING) {
                await tryCatch(() => Promise.race(pendingLists.values()))
                continue
            }
            pending = (async () => {
                const json = JSON.stringify(await loader())
                if (generation === registryGeneration) {
                    storeList({ key, json })
                }
                return json
            })()
            pendingLists.set(pendingKey, pending)
        }
        let json: string
        try {
            json = await pending
        }
        finally {
            if (pendingLists.get(pendingKey) === pending) {
                pendingLists.delete(pendingKey)
            }
        }
        if (generation === registryGeneration) {
            return JSON.parse(json)
        }
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

type LoadListParams = {
    key: string
    loader: () => Promise<PieceMetadataSchema[]>
}
