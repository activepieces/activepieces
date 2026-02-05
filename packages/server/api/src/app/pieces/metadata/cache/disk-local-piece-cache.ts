import path from 'path'
import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp, memoryLock, rejectedPromiseHandler } from '@activepieces/server-shared'
import KeyvSqlite from '@keyv/sqlite'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import Keyv from 'keyv'
import cron from 'node-cron'
import { repoFactory } from '../../../core/db/repo-factory'
import { pubsub } from '../../../helper/pubsub'
import { system } from '../../../helper/system/system'
import { PieceMetadataEntity, PieceMetadataSchema } from '../piece-metadata-entity'
import { fetchPiecesFromDB, filterPieceBasedOnType, isSupportedRelease, lastVersionOfEachPiece, loadDevPiecesIfEnabled } from '../utils'
import { GetListParams, GetPieceVersionParams, GetRegistryParams, LocalPieceCache, PieceRegistryEntry, REDIS_REFRESH_LOCAL_PIECES_CHANNEL, State } from '.'
import { isNil, LocalesEnum } from '@activepieces/shared'

const repo = repoFactory(PieceMetadataEntity)

const META_REGISTRY_KEY = 'pieces:registry'
const META_STATE_KEY = 'pieces:state'
const META_LIST_KEY = (locale: LocalesEnum): string => `pieces:list:${locale}`
const META_PIECE_KEY = (pieceName: string, version: string, platformId: string | undefined): string => `pieces:piece:${pieceName}:${version}:${platformId ?? 'OFFICIAL'}`

let cacheInstance: KVCacheInstance | null = null

export const diskLocalPieceCache = (log: FastifyBaseLogger): LocalPieceCache => ({
    async setup(): Promise<void> {
        await getOrCreateCache()
        await updateCache(log)
        cron.schedule('*/15 * * * *', () => {
            log.info('[diskLocalPieceCache] Refreshing pieces cache via cron job')
            rejectedPromiseHandler(updateCache(log), log)
        })
        await pubsub.subscribe(REDIS_REFRESH_LOCAL_PIECES_CHANNEL, () => {
            log.info('[diskLocalPieceCache] Refreshing pieces cache via pubsub')
            rejectedPromiseHandler(updateCache(log), log)
        })
        log.info('[diskLocalPieceCache] Disk local piece cache initialized')
    },
    async refresh(): Promise<void> {
        await updateCache(log)
    },
    async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
        const { platformId, locale = LocalesEnum.ENGLISH } = params
        const cache = await getOrCreateCache()
        const allPieces = (await cache.db.get(META_LIST_KEY(locale))) as PieceMetadataSchema[] | undefined
        const devPieces = await loadDevPiecesIfEnabled(log)
        const translatedDevPieces = devPieces.map((piece) => pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: true }))
        
        // Filter FIRST by platformId, then de-duplicate - this ensures each platform
        // sees both official pieces and their own custom pieces correctly
        const filteredPieces = [...(allPieces ?? []), ...translatedDevPieces].filter((piece) => filterPieceBasedOnType(platformId, piece))
        return lastVersionOfEachPiece(filteredPieces)
    },
    async getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null> {
        const { pieceName, version, platformId } = params
        const cache = await getOrCreateCache()
        const cachedPiece = (await cache.db.get(META_PIECE_KEY(pieceName, version, platformId))) as PieceMetadataSchema | undefined
        const devPieces = await loadDevPiecesIfEnabled(log)
        const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
        if (!isNil(devPiece)) {
            return devPiece
        }
        return cachedPiece ?? null
    },
    async getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
        const { release, platformId } = params
        const cache = await getOrCreateCache()
        const devPieces = (await loadDevPiecesIfEnabled(log)).map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
            platformId: piece.platformId,
            pieceType: piece.pieceType,
        }))
        return [...cache.registry, ...devPieces]
            .filter((piece) => filterPieceBasedOnType(platformId, piece))
            .filter((piece) => isNil(release) || isSupportedRelease(release, piece))
    },
})

async function updateCache(log: FastifyBaseLogger): Promise<void> {
    return memoryLock.runExclusive({
        key: 'update-piece-kv-cache',
        fn: async () => {
            const newestState: State | undefined = await repo()
                .createQueryBuilder()
                .select('MAX(updated)', 'recentUpdate')
                .addSelect('count(*)', 'count')
                .getRawOne()

            const cacheInstance = await getOrCreateCache()
            const stored = (await cacheInstance.db.get(META_STATE_KEY)) as State | undefined
            if (!isNil(stored) && !isNil(newestState) && stored.recentUpdate === newestState.recentUpdate && stored.count === newestState.count) {
                log.debug('[pieceKVCache] Cache is up to date, skipping refresh')
                return
            }
            log.info({
                newestState: JSON.stringify(newestState),
                stored: JSON.stringify(stored),
            }, '[updateCache] Cache is out of date, updating')
            const pieces = await fetchPiecesFromDB()
            await populateCache(pieces, log)
            log.info('[pieceKVCache] Cache update complete')
        },
    })
}

async function populateCache(sortedPieces: PieceMetadataSchema[], log: FastifyBaseLogger): Promise<void> {
    const cache = await getOrCreateCache()
    const { db } = cache
    cache.registry = sortedPieces.map(piece => ({
        name: piece.name,
        version: piece.version,
        minimumSupportedRelease: piece.minimumSupportedRelease,
        maximumSupportedRelease: piece.maximumSupportedRelease,
        pieceType: piece.pieceType,
        platformId: piece.platformId,
    }))
    await db.set(META_REGISTRY_KEY, cache.registry)

    await storePieces(sortedPieces)
    log.info({ sortedPieces: sortedPieces.length }, '[populateCache] Storing pieces')
    const startTime = Date.now()
    for (const piece of sortedPieces) {
        await storePiece(piece)
    }
    const state: State = {
        recentUpdate: sortedPieces.length > 0 ? new Date(Math.max(...sortedPieces.map(piece => dayjs(piece.updated).valueOf()))).toISOString() : undefined,
        count: sortedPieces.length.toString(),
    }
    await db.set(META_STATE_KEY, state)
    log.info({
        count: sortedPieces.length,
        duration: Date.now() - startTime,
    }, '[populateCache] Stored pieces cache')
}

async function storePieces(sortedPieces: PieceMetadataSchema[]): Promise<void> {
    const { db } = await getOrCreateCache()
    // Store ALL pieces (not de-duplicated) - de-duplication happens at query time
    // after filtering by platformId to ensure correct visibility per platform
    const supportedLocales = Object.values(LocalesEnum)
    for (const locale of supportedLocales) {
        const translatedPieces = sortedPieces.map((piece) => 
            pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale }),
        )
        await db.set(META_LIST_KEY(locale), translatedPieces)
    }
}

async function storePiece(piece: PieceMetadataSchema): Promise<void> {
    const { db } = await getOrCreateCache()
    await db.set(META_PIECE_KEY(piece.name, piece.version, piece.platformId), piece)
}

async function getOrCreateCache(): Promise<KVCacheInstance> {
    if (!isNil(cacheInstance)) {
        return cacheInstance
    }
    return memoryLock.runExclusive({
        key: 'create-piece-kv-cache',
        fn: async () => {
            if (!isNil(cacheInstance)) {
                return cacheInstance
            }
            const pm2Enabled = system.getBoolean(AppSystemProp.PM2_ENABLED) ?? false
            const cacheId = pm2Enabled ? (process.env.NODE_APP_INSTANCE ?? '0') : 'default'
            const dbPath = path.resolve(path.join(process.cwd(), `pieces-cache-db-${cacheId}.sqlite`))
            const db = new Keyv({
                store: new KeyvSqlite(`sqlite://${dbPath}`),
            })

            const registry = ((await db.get(META_REGISTRY_KEY)) as PieceRegistryEntry[] | undefined) ?? []
            cacheInstance = {
                db,
                registry,
            }
            return cacheInstance
        },
    })
}

type KVCacheInstance = {
    db: Keyv
    registry: PieceRegistryEntry[]
}
