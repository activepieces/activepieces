import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { isNil, LocalesEnum } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { IsNull } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { pubsub } from '../../../helper/pubsub'
import { system } from '../../../helper/system/system'
import { PieceMetadataEntity, PieceMetadataSchema } from '../piece-metadata-entity'
import { fetchPiecesFromDB, filterPieceBasedOnType, isSupportedRelease, lastVersionOfEachPiece, loadDevPiecesIfEnabled } from '../utils'
import { GetListParams, GetPieceVersionParams, GetRegistryParams, LocalPieceCache, PieceRegistryEntry, REDIS_REFRESH_LOCAL_PIECES_CHANNEL } from '.'

const repo = repoFactory(PieceMetadataEntity)

const CACHE_TTL_MS = 900000 // 15 minutes

let cache: LRU<unknown>

const CACHE_KEY = {
    list: (locale: LocalesEnum): string => `list:${locale}`,
    piece: (name: string, version: string, platformId: string | undefined): string => `piece:${name}:${version}:${platformId ?? 'OFFICIAL'}`,
    registry: (): string => 'registry',
}

export const lruPieceCache = (log: FastifyBaseLogger): LocalPieceCache => ({
    async setup(): Promise<void> {
        const cacheMaxSize = system.getNumberOrThrow(AppSystemProp.PIECES_CACHE_MAX_ENTRIES)
        cache = lru(cacheMaxSize, CACHE_TTL_MS)

        await pubsub.subscribe(REDIS_REFRESH_LOCAL_PIECES_CHANNEL, () => {
            log.info('[lruPieceCache] Refreshing pieces cache via pubsub')
            rejectedPromiseHandler(this.refresh(), log)
        })
        log.info('[lruPieceCache] LRU piece cache initialized')
    },
    
    async refresh(): Promise<void> {
        log.info('[lruPieceCache] Clearing cache')
        cache.clear()
    },
    
    async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
        const { platformId, locale = LocalesEnum.ENGLISH } = params
        const cacheKey = CACHE_KEY.list(locale)
        
        let allTranslatedPieces = cache.get(cacheKey) as PieceMetadataSchema[] | undefined
        
        if (isNil(allTranslatedPieces)) {
            const allPieces = await fetchPiecesFromDB()
            allTranslatedPieces = allPieces.map((piece) => {
                const translated = pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: false })
                const { i18n: _i18n, ...translatedWithoutI18n } = translated
                return translatedWithoutI18n as PieceMetadataSchema
            })
            cache.set(cacheKey, allTranslatedPieces)
        }
        
        const devPieces = await loadDevPiecesIfEnabled(log)
        const translatedDevPieces = devPieces.map((piece) => 
            pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: false }),
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
        const cacheKey = CACHE_KEY.piece(pieceName, version, platformId)
        
        const devPieces = await loadDevPiecesIfEnabled(log)
        const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
        if (!isNil(devPiece)) {
            return devPiece
        }
        
        let piece = cache.get(cacheKey) as PieceMetadataSchema | undefined
        
        if (isNil(piece)) {
            const foundPiece = await repo().findOne({
                where: {
                    name: pieceName,
                    version,
                    platformId: platformId ?? IsNull(),
                },
            })

            if (isNil(foundPiece)) {
                return null
            }

            piece = foundPiece
            cache.set(cacheKey, piece)
        }
        
        return piece
    },
    
    async getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
        const { release, platformId } = params
        const cacheKey = CACHE_KEY.registry()
        
        let allRegistry = cache.get(cacheKey) as PieceRegistryEntry[] | undefined
        
        if (isNil(allRegistry)) {
            const allPieces = await fetchPiecesFromDB()
            allRegistry = allPieces.map(piece => ({
                name: piece.name,
                version: piece.version,
                minimumSupportedRelease: piece.minimumSupportedRelease,
                maximumSupportedRelease: piece.maximumSupportedRelease,
                platformId: piece.platformId,
                pieceType: piece.pieceType,
            }))
            cache.set(cacheKey, allRegistry)
        }
        
        const devPieces = (await loadDevPiecesIfEnabled(log)).map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
            platformId: piece.platformId,
            pieceType: piece.pieceType,
        }))
        
        return [...allRegistry, ...devPieces]
            .filter((piece) => filterPieceBasedOnType(platformId, piece))
            .filter((piece) => isNil(release) || isSupportedRelease(release, piece))
    },
})
