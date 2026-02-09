import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { lru, LRU } from 'tiny-lru'
import { IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { fetchPiecesFromDB, filterPieceBasedOnType, isSupportedRelease, lastVersionOfEachPiece, loadDevPiecesIfEnabled } from './utils'
import { ApEnvironment, isNil, LocalesEnum, PieceType } from '@activepieces/shared'

export const REDIS_REFRESH_LOCAL_PIECES_CHANNEL = 'refresh-local-pieces-cache'

const repo = repoFactory(PieceMetadataEntity)

let cache: LRU<unknown>
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === ApEnvironment.TESTING

const CACHE_KEY = {
    list: (locale: LocalesEnum): string => `list:${locale}`,
    piece: (name: string, version: string, platformId: string | undefined): string => `piece:${name}:${version}:${platformId ?? 'OFFICIAL'}`,
    registry: (): string => 'registry',
}

export const localPieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            const cacheMaxSize = system.getNumberOrThrow(AppSystemProp.PIECES_CACHE_MAX_ENTRIES)
            cache = lru(cacheMaxSize)
            
            if (isTestingEnvironment) {
                return
            }
            
            await warmCache(log)
            
            cron.schedule('*/15 * * * *', () => {
                log.info('[lruPieceCache] Refreshing cache via cron job')
                rejectedPromiseHandler(this.refresh(), log)
            })
            
            await pubsub.subscribe(REDIS_REFRESH_LOCAL_PIECES_CHANNEL, () => {
                log.info('[lruPieceCache] Refreshing cache via pubsub')
                rejectedPromiseHandler(this.refresh(), log)
            })
            
            log.info('[lruPieceCache] LRU piece cache initialized')
        },
        
        async refresh(): Promise<void> {
            if (isTestingEnvironment) {
                return
            }
            await warmCache(log)
        },
        
        async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
            const { platformId, locale = LocalesEnum.ENGLISH } = params
            const cacheKey = CACHE_KEY.list(locale)
            let allTranslatedPieces = cache.get(cacheKey) as PieceMetadataSchema[] | undefined
            
            if (isNil(allTranslatedPieces)) {
                const englishCacheKey = CACHE_KEY.list(LocalesEnum.ENGLISH)
                const allPieces = await getCachedOrFetch(englishCacheKey, () => fetchPiecesFromDB())

                allTranslatedPieces = allPieces.map((piece) => {
                    const translated = pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: false })
                    const { i18n: _i18n, ...translatedWithoutI18n } = translated
                    return translatedWithoutI18n
                })
                cache.set(cacheKey, allTranslatedPieces)
            }
            
            const devPieces = await loadDevPiecesIfEnabled(log)
            const translatedDevPieces = devPieces.map((piece) => 
                pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: true }),
            )
            
            // Filter FIRST by platformId, then de-duplicate - this ensures each platform
            // sees both official pieces and their own custom pieces correctly
            const filteredPieces = [...allTranslatedPieces, ...translatedDevPieces].filter((piece) => 
                filterPieceBasedOnType(platformId, piece),
            )
            
            return lastVersionOfEachPiece(filteredPieces)
        },
        
        async getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null> {
            const { pieceName, version, platformId } = params
            
            const devPieces = await loadDevPiecesIfEnabled(log)
            const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
            if (!isNil(devPiece)) {
                return devPiece
            }
            
            const cacheKey = CACHE_KEY.piece(pieceName, version, platformId)
            
            return getCachedOrFetch(cacheKey, async () => {
                const foundPiece = await repo().findOne({
                    where: {
                        name: pieceName,
                        version,
                        platformId: platformId ?? IsNull(),
                    },
                })
                return foundPiece ?? null
            })
        },
        
        async getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
            const { release, platformId } = params
            const cacheKey = CACHE_KEY.registry()
            const allRegistry = await getCachedOrFetch(cacheKey, async () => {
                const allPieces = await fetchPiecesFromDB()
                return allPieces.map(toRegistryEntry)
            })
            
            const devPieces = (await loadDevPiecesIfEnabled(log)).map(toRegistryEntry)
            
            return [...allRegistry, ...devPieces]
                .filter((piece) => filterPieceBasedOnType(platformId, piece))
                .filter((piece) => isNil(release) || isSupportedRelease(release, piece))
        },
    }
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

async function warmCache(log: FastifyBaseLogger): Promise<void> {
    try {
        log.info('[lruPieceCache] Warming cache with English list and registry')
        
        const cacheMaxSize = system.getNumberOrThrow(AppSystemProp.PIECES_CACHE_MAX_ENTRIES)
        const newCache = lru(cacheMaxSize)
        
        const englishPieces = await fetchPiecesFromDB()
        newCache.set(CACHE_KEY.list(LocalesEnum.ENGLISH), englishPieces)

        const registry = englishPieces.map(toRegistryEntry)
        newCache.set(CACHE_KEY.registry(), registry)
        
        cache = newCache
        
        log.info('[lruPieceCache] Cache warming completed')
    }
    catch (error) {
        log.error({ error }, '[lruPieceCache] Error warming cache')
    }
}

const inFlightQueries = new Map<string, Promise<unknown>>()

async function getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
): Promise<T> {
    if (isTestingEnvironment) {
        return fetchFn()
    }

    const cached = cache.get(cacheKey) as T | undefined
    if (!isNil(cached)) {
        return cached
    }
    
    const existingQuery = inFlightQueries.get(cacheKey) as Promise<T> | undefined
    if (!isNil(existingQuery)) {
        return existingQuery
    }
    
    const queryPromise = (async (): Promise<T> => {
        try {
            const result = await fetchFn()
            cache.set(cacheKey, result)
            return result
        }
        finally {
            inFlightQueries.delete(cacheKey)
        }
    })()
    
    inFlightQueries.set(cacheKey, queryPromise)
    
    return queryPromise
}

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}

type GetPieceVersionParams = {
    pieceName: string
    version: string
    platformId?: string
}

type GetListParams = {
    platformId?: string
    locale?: LocalesEnum
}

type GetRegistryParams = {
    release: string | undefined
    platformId?: string
}

