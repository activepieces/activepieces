import path from 'path'
import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp, filePiecesUtils, memoryLock, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ApEnvironment, apId, isEmpty, isNil, LocalesEnum, PackageType, PieceType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { Level } from 'level'
import cron from 'node-cron'
import semVer from 'semver'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'

const repo = repoFactory(PieceMetadataEntity)
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)

export const REDIS_REFRESH_LOCAL_PIECES_CHANNEL = 'refresh-local-pieces-cache'

const META_REGISTRY_KEY = 'pieces:registry'
const META_STATE_KEY = 'pieces:state'
const META_LIST_KEY = (locale: LocalesEnum) => `pieces:list:${locale}`
const META_PIECE_KEY = (pieceName: string, version: string, locale: LocalesEnum) => `pieces:piece:${pieceName}:${version}:${locale}`
const DEFAULT_LOCALE = LocalesEnum.ENGLISH

let cacheInstance: KVCacheInstance | null = null


export const localPieceCache = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        await getOrCreateCache()
        await updateCache(log)
        cron.schedule('*/15 * * * *', () => {
            log.info('[localPieceCache] Refreshing pieces cache via cron job')
            rejectedPromiseHandler(updateCache(log), log)
        })
        await pubsub.subscribe(REDIS_REFRESH_LOCAL_PIECES_CHANNEL, () => {
            log.info('[localPieceCache] Refreshing pieces cache via pubsub')
            rejectedPromiseHandler(updateCache(log), log)
        })
    },
    async refresh(): Promise<void> {
        await updateCache(log)
    },
    async getList(locale: LocalesEnum | undefined): Promise<PieceMetadataSchema[]> {
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDB()
            return lastVersionOfEachPiece(pieces).map(piece => pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale))
        }
        const cache = await getOrCreateCache()
        const list = await cache.db.get<string, PieceMetadataSchema[]>(META_LIST_KEY(locale ?? DEFAULT_LOCALE), { valueEncoding: 'json' })
        const devPieces = (await loadDevPiecesIfEnabled(log)).map(piece => pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale))
        return [...(list ?? []), ...devPieces]
    },
    async getPieceVersion(pieceName: string, version: string, locale?: LocalesEnum): Promise<PieceMetadataSchema | null> {
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDB()
            const piece = pieces.find(p => p.name === pieceName && p.version === version)
            if (!piece) {
                return null
            }
            return locale ? pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale) : piece
        }
        const cache = await getOrCreateCache()
        const piece = await cache.db.get<string, PieceMetadataSchema>(META_PIECE_KEY(pieceName, version, locale ?? DEFAULT_LOCALE), { valueEncoding: 'json' })
        const devPieces = await loadDevPiecesIfEnabled(log)
        const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
        if (!isNil(devPiece)) {
            return locale ? pieceTranslation.translatePiece<PieceMetadataSchema>(devPiece, locale ?? DEFAULT_LOCALE) : devPiece
        }
        return piece
    },
    async getRegistry(): Promise<PieceRegistryEntry[]> {
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDB()
            return pieces.map(piece => ({
                name: piece.name,
                version: piece.version,
                minimumSupportedRelease: piece.minimumSupportedRelease,
                maximumSupportedRelease: piece.maximumSupportedRelease,
            }))
        }
        const cache = await getOrCreateCache()
        const devPieces = await loadDevPiecesIfEnabled(log)
        return [...cache.registry, ...devPieces.map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
        }))]
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
            const stored = await cacheInstance.db.get<string, State>(META_STATE_KEY, { valueEncoding: 'json' })
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


function lastVersionOfEachPiece(pieces: PieceMetadataSchema[]): PieceMetadataSchema[] {
    return pieces.filter((piece, index, self) => index === self.findIndex((t) => t.name === piece.name))
}

async function fetchPiecesFromDB(): Promise<PieceMetadataSchema[]> {
    const piecesFromDatabase = await repo().find()
    return piecesFromDatabase.sort(sortByNameAndVersionDesc)
}

function sortByNameAndVersionDesc(a: PieceMetadataSchema, b: PieceMetadataSchema): number {
    if (a.name !== b.name) {
        return a.name.localeCompare(b.name)
    }
    const aValid = semVer.valid(a.version)
    const bValid = semVer.valid(b.version)
    if (!aValid && !bValid) {
        return b.version.localeCompare(a.version)
    }
    if (!aValid) {
        return 1
    }
    if (!bValid) {
        return -1
    }
    return semVer.rcompare(a.version, b.version)
}

async function populateCache(sortedPieces: PieceMetadataSchema[], log: FastifyBaseLogger): Promise<void> {
    const cache = await getOrCreateCache()
    const { db } = cache
    cache.registry = sortedPieces.map(piece => ({
        name: piece.name,
        version: piece.version,
        minimumSupportedRelease: piece.minimumSupportedRelease,
        maximumSupportedRelease: piece.maximumSupportedRelease,
    }))
    await db.put(META_REGISTRY_KEY, cache.registry, { valueEncoding: 'json' })


    await storePieces(sortedPieces, log)
    for (const piece of sortedPieces) {
        await storePiece(piece)
    }

    const state: State = {
        recentUpdate: new Date(Math.max(...sortedPieces.map(piece => dayjs(piece.updated).valueOf()))).toISOString(),
        count: sortedPieces.length.toString(),
    }
    await db.put(META_STATE_KEY, state, { valueEncoding: 'json' })
    log.info({
        count: sortedPieces.length,
    }, '[populateCache] Stored pieces cache')
}

async function storePieces(sortedPieces: PieceMetadataSchema[], log: FastifyBaseLogger): Promise<void> {
    const { db } = await getOrCreateCache()
    const latestVersions = sortedPieces.filter((piece, index, self) => index === self.findIndex((t) => t.name === piece.name))

    const locales = Object.values(LocalesEnum) as LocalesEnum[]
    for (const locale of locales) {
        const translatedLatestVersions = latestVersions.map((p) => pieceTranslation.translatePiece<PieceMetadataSchema>(p, locale))
        await db.put(META_LIST_KEY(locale), translatedLatestVersions, { valueEncoding: 'json' })
    }
}

async function storePiece(piece: PieceMetadataSchema): Promise<void> {
    const { db } = await getOrCreateCache()
    const locales = Object.values(LocalesEnum) as LocalesEnum[]
    for (const locale of locales) {
        const translatedPiece = pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale)
        await db.put(META_PIECE_KEY(piece.name, piece.version, locale), translatedPiece, { valueEncoding: 'json' })
    }
}

async function loadDevPiecesIfEnabled(log: FastifyBaseLogger): Promise<PieceMetadataSchema[]> {
    const devPiecesConfig = system.get(AppSystemProp.DEV_PIECES)
    if (isNil(devPiecesConfig) || isEmpty(devPiecesConfig)) {
        return []
    }
    const piecesNames = devPiecesConfig.split(',')
    const pieces = await filePiecesUtils(log).loadDistPiecesMetadata(piecesNames)

    return pieces.map((p): PieceMetadataSchema => ({
        id: apId(),
        ...p,
        projectUsage: 0,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    }))
}

async function getOrCreateCache(): Promise<KVCacheInstance> {
    if (isNil(cacheInstance)) {
        const baseDir = system.getOrThrow(AppSystemProp.CONFIG_PATH)
        const dbPath = path.join(baseDir, 'pieces-cache-db')
        const db = new Level<string, unknown>(dbPath, {
            valueEncoding: 'json',
            keyEncoding: 'utf8',
        })

        await db.open()

        const registry = (await db.get<string, PieceRegistryEntry[]>(META_REGISTRY_KEY, { valueEncoding: 'json' })) ?? []
        cacheInstance = {
            db,
            registry,
        }
    }
    return cacheInstance
}

type State = {
    recentUpdate: string | undefined
    count: string
}

type PieceRegistryEntry = {
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}

type KVCacheInstance = {
    db: Level<string, unknown>
    registry: PieceRegistryEntry[]
}
