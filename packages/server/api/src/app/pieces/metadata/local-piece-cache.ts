import path from 'path'
import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp, filePiecesUtils, memoryLock, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ApEnvironment, apId, isEmpty, isNil, LocalesEnum, PackageType, PieceType } from '@activepieces/shared'
import KeyvSqlite from '@keyv/sqlite'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import Keyv from 'keyv'
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
const META_LIST_KEY = (locale: LocalesEnum): string => `pieces:list:${locale}`
const META_PIECE_KEY = (pieceName: string, version: string, platformId: string | undefined) => `pieces:piece:${pieceName}:${version}:${platformId ?? 'OFFICIAL'}`

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
    async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
        const { platformId, locale = LocalesEnum.ENGLISH } = params
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDB()
            return lastVersionOfEachPiece(pieces)
                .filter((piece) => filterPieceBasedOnType(platformId, piece))
        }
        const cache = await getOrCreateCache()
        const list = (await cache.db.get(META_LIST_KEY(locale))) as PieceMetadataSchema[] | undefined
        const devPieces = await loadDevPiecesIfEnabled(log)
        const translatedDevPieces = devPieces.map((piece) => pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: true }))
        return [...(list ?? []), ...translatedDevPieces].filter((piece) => filterPieceBasedOnType(platformId, piece))
    },
    async getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null> {
        const { pieceName, version, platformId } = params
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDB()
            return pieces.find(p => p.name === pieceName && p.version === version) ?? null
        }
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
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDB()
            return pieces.map(piece => ({
                name: piece.name,
                version: piece.version,
                minimumSupportedRelease: piece.minimumSupportedRelease,
                maximumSupportedRelease: piece.maximumSupportedRelease,
                platformId: piece.platformId,
                pieceType: piece.pieceType,
            }))
        }
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
    const latestVersions = sortedPieces.filter((piece, index, self) => index === self.findIndex((t) => t.name === piece.name))
    
    const supportedLocales = Object.values(LocalesEnum)
    for (const locale of supportedLocales) {
        const translatedPieces = latestVersions.map((piece) => 
            pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale }),
        )
        await db.set(META_LIST_KEY(locale), translatedPieces)
    }
}

async function storePiece(piece: PieceMetadataSchema): Promise<void> {
    const { db } = await getOrCreateCache()
    await db.set(META_PIECE_KEY(piece.name, piece.version, piece.platformId), piece)
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


function filterPieceBasedOnType(platformId: string | undefined, piece: PieceMetadataSchema | PieceRegistryEntry): boolean {
    return isOfficialPiece(piece) || isCustomPiece(platformId, piece)
}

function isOfficialPiece(piece: PieceMetadataSchema | PieceRegistryEntry): boolean {
    return piece.pieceType === PieceType.OFFICIAL && isNil(piece.platformId)
}

function isCustomPiece(platformId: string | undefined, piece: PieceMetadataSchema | PieceRegistryEntry): boolean {
    if (isNil(platformId)) {
        return false
    }
    return piece.platformId === platformId && piece.pieceType === PieceType.CUSTOM
}


function isSupportedRelease(release: string | undefined, piece: { minimumSupportedRelease?: string, maximumSupportedRelease?: string }): boolean {
    if (isNil(release)) {
        return true
    }
    if (!semVer.valid(release) || !semVer.valid(piece.minimumSupportedRelease) || !semVer.valid(piece.maximumSupportedRelease)) {
        return false
    }

    if (!isNil(piece.maximumSupportedRelease) && semVer.compare(release, piece.maximumSupportedRelease) == 1) {
        return false
    }
    if (!isNil(piece.minimumSupportedRelease) && semVer.compare(release, piece.minimumSupportedRelease) == -1) {
        return false
    }
    return true
}


type State = {
    recentUpdate: string | undefined
    count: string
}

type GetPieceVersionParams = {
    pieceName: string
    version: string
    platformId?: string
}

type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}

type GetListParams = {
    platformId?: string
    locale?: LocalesEnum
}

type GetRegistryParams = {
    release: string | undefined
    platformId?: string
}

type KVCacheInstance = {
    db: Keyv
    registry: PieceRegistryEntry[]
}
