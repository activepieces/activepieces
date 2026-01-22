import path from 'path'
import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp, filePiecesUtils, memoryLock, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ApEnvironment, apId, isEmpty, isNil, LocalesEnum, PackageType, PieceType } from '@activepieces/shared'
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
const DEFAULT_LOCALE = LocalesEnum.ENGLISH

let cacheInstance: KVCacheInstance | null = null

const getDbPath = (): string => {
    const baseDir = system.getOrThrow(AppSystemProp.CONFIG_PATH)
    return path.join(baseDir, 'pieces-cache-db')
}

async function getCache(): Promise<KVCacheInstance> {
    if (isNil(cacheInstance)) {
        await initializeLevelDB()
    }
    if (isNil(cacheInstance)) {
        throw new Error('Failed to initialize cache')
    }
    return cacheInstance
}

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        await initializeLevelDB()
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
    async getLatestVersions(locale: LocalesEnum): Promise<PieceMetadataSchema[]> {
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDb()
            return pieces
        }
        const cache = await getCache()
        const pieces = await cache.db.get<string, PieceMetadataSchema[]>(`list:${locale ?? DEFAULT_LOCALE}`, { valueEncoding: 'json' })
        const devPieces = await loadDevPiecesIfEnabled(log)
        return [...(pieces ?? []), ...(devPieces.map(piece => pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale)))]
    },
    async getList(locale: LocalesEnum | undefined): Promise<PieceMetadataSchema[]> {
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDb()
            const latestVersions = getLatestVersionOfEachPiece(pieces)
            return latestVersions.map(piece => pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale))
        }
        const cache = await getCache()
        const list = await cache.db.get<string, PieceMetadataSchema[]>(`list:${locale ?? DEFAULT_LOCALE}`, { valueEncoding: 'json' })
        const devPieces = (await loadDevPiecesIfEnabled(log)).map(piece => pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale))
        return [...(list ?? []), ...devPieces]
    },
    async getPieceVersion(pieceName: string, version: string, locale?: LocalesEnum): Promise<PieceMetadataSchema | null> {
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDb()
            const piece = pieces.find(p => p.name === pieceName && p.version === version)
            if (!piece) {
                return null
            }
            return locale ? pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale) : piece
        }
        const cache = await getCache()
        const key = `${pieceName}:${version}:${locale ?? DEFAULT_LOCALE}`
        const piece = await cache.db.get<string, PieceMetadataSchema>(key, { valueEncoding: 'json' })
        if (piece) {
            return piece
        }
        const devPieces = await loadDevPiecesIfEnabled(log)
        const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
        if (!devPiece) {
            return null
        }
        return locale ? pieceTranslation.translatePiece<PieceMetadataSchema>(devPiece, locale) : devPiece
    },
    async getRegistry(): Promise<PieceRegistryEntry[]> {
        if (environment === ApEnvironment.TESTING) {
            const pieces = await fetchPiecesFromDb()
            return pieces.map(piece => ({
                name: piece.name,
                version: piece.version,
                minimumSupportedRelease: piece.minimumSupportedRelease,
                maximumSupportedRelease: piece.maximumSupportedRelease,
            }))
        }
        const cache = await getCache()
        const devPieces = await loadDevPiecesIfEnabled(log)
        return [...cache.registry, ...devPieces.map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
        }))]
    },
})

async function initializeLevelDB(): Promise<void> {
    if (cacheInstance) {
        return
    }

    const dbPath = getDbPath()
    const db = new Level<string, unknown>(dbPath, {
        valueEncoding: 'json',
        keyEncoding: 'utf8',
    })

    await db.open()
    
    const registry = (await db.get<string, PieceRegistryEntry[]>('meta:registry', { valueEncoding: 'json' })) ?? []
    cacheInstance = {
        db,
        registry,
    }
}

async function updateCache(log: FastifyBaseLogger): Promise<void> {
    return memoryLock.runExclusive({
        key: 'update-piece-kv-cache',
        fn: async () => {
            const newestState: State | undefined = await repo()
                .createQueryBuilder()
                .select('MAX(updated)', 'recentUpdate')
                .addSelect('count(*)', 'count')
                .getRawOne()

            if (!isNil(newestState) && !isNil(cacheInstance)) {
                const needUpdate = await checkIfUpdateNeeded(newestState, cacheInstance.db)
                if (!needUpdate) {
                    log.debug('[pieceKVCache] Cache is up to date, skipping refresh')
                    return
                }
            }

            log.info('[pieceKVCache] Updating cache...')
            const pieces = await fetchPiecesFromDb()
            await populateCache(pieces, log)
            log.info('[pieceKVCache] Cache update complete')
        },
    })
}

async function checkIfUpdateNeeded(state: State, db: Level<string, unknown>): Promise<boolean> {
    const metaKey = 'meta:state'
    const stored = await db.get<string, State>(metaKey, { valueEncoding: 'json' })
    
    if (!stored) {
        return true
    }
    
    return stored.recentUpdate !== state.recentUpdate || stored.count !== state.count
}

async function fetchPiecesFromDb(): Promise<PieceMetadataSchema[]> {
    const piecesFromDatabase = await repo().find()
    return piecesFromDatabase.sort((a, b) => {
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
    })
}

function getLatestVersionOfEachPiece(pieces: PieceMetadataSchema[]): PieceMetadataSchema[] {
    const latestVersions = new Map<string, PieceMetadataSchema>()
    const projectUsageMap = new Map<string, number>()
    
    for (const piece of pieces) {
        const existingPiece = latestVersions.get(piece.name)
        
        const currentUsage = projectUsageMap.get(piece.name) ?? 0
        projectUsageMap.set(piece.name, currentUsage + (piece.projectUsage ?? 0))
        
        if (!existingPiece) {
            latestVersions.set(piece.name, piece)
            continue
        }
        
        const existingVersion = semVer.valid(existingPiece.version)
        const currentVersion = semVer.valid(piece.version)
        
        if (existingVersion && currentVersion) {
            if (semVer.gt(currentVersion, existingVersion)) {
                latestVersions.set(piece.name, piece)
            }
        }
        else if (!existingVersion && currentVersion) {
            latestVersions.set(piece.name, piece)
        }
    }
    
    return Array.from(latestVersions.values()).map(piece => ({
        ...piece,
        projectUsage: projectUsageMap.get(piece.name) ?? 0,
    }))
}

async function populateCache(pieces: PieceMetadataSchema[], log: FastifyBaseLogger): Promise<void> {
    const cache = await getCache()
    const { db } = cache
    
    const count = pieces.length
    const recentUpdate = pieces.length > 0 
        ? pieces.reduce((acc, piece) => {
            return !acc || (piece.updated && piece.updated > acc) ? piece.updated : acc
        }, pieces[0].updated)
        : undefined
    const state: State = {
        recentUpdate,
        count: String(count),
    }

    cache.registry = pieces.map(piece => ({
        name: piece.name,
        version: piece.version,
        minimumSupportedRelease: piece.minimumSupportedRelease,
        maximumSupportedRelease: piece.maximumSupportedRelease,
    }))

    await db.put('meta:registry', cache.registry, { valueEncoding: 'json' })

    const latestVersions = getLatestVersionOfEachPiece(pieces)
    
    const locales = Object.values(LocalesEnum) as LocalesEnum[]
    for (const locale of locales) {
        const translatedLatestVersions = latestVersions.map(piece => 
            pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale),
        )
        
        await db.put(`list:${locale}`, translatedLatestVersions, { valueEncoding: 'json' })
        log.info(`[populateCache] Stored ${translatedLatestVersions.length} pieces for locale ${locale}`)
    }
    
    for (const piece of pieces) {
        for (const locale of locales) {
            const translatedPiece = pieceTranslation.translatePiece<PieceMetadataSchema>(piece, locale)
            const key = `${piece.name}:${piece.version}:${locale}`
            await db.put(key, translatedPiece, { valueEncoding: 'json' })
        }
    }

    await db.put('meta:state', state, { valueEncoding: 'json' })
    
    log.info(`[populateCache] Stored ${count} pieces with ${latestVersions.length} latest versions across ${locales.length} locales`)
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
