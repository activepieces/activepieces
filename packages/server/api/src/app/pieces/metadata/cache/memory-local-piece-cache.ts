import { pieceTranslation } from '@activepieces/pieces-framework'
import { memoryLock, rejectedPromiseHandler } from '@activepieces/server-shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { repoFactory } from '../../../core/db/repo-factory'
import { pubsub } from '../../../helper/pubsub'
import { PieceMetadataEntity, PieceMetadataSchema } from '../piece-metadata-entity'
import { fetchPiecesFromDB, filterPieceBasedOnType, isSupportedRelease, lastVersionOfEachPiece, loadDevPiecesIfEnabled } from '../utils'
import { GetListParams, GetPieceVersionParams, GetRegistryParams, LocalPieceCache, PieceRegistryEntry, REDIS_REFRESH_LOCAL_PIECES_CHANNEL, State } from '.'
import { isNil, LocalesEnum, Result, tryCatch } from '@activepieces/shared'

let cache: PieceMetadataSchema[] | null = null
const repo = repoFactory(PieceMetadataEntity)

export const memoryLocalPieceCache = (log: FastifyBaseLogger): LocalPieceCache => ({
    async setup(): Promise<void> {
        await updateCache(log)
        cron.schedule('*/15 * * * *', () => {
            log.info('[memoryLocalPieceCache] Refreshing pieces cache via cron job')
            rejectedPromiseHandler(updateCache(log), log)
        })
        await pubsub.subscribe(REDIS_REFRESH_LOCAL_PIECES_CHANNEL, () => {
            log.info('[memoryLocalPieceCache] Refreshing pieces cache via pubsub')
            rejectedPromiseHandler(updateCache(log), log)
        })
        log.info('[memoryLocalPieceCache] Memory local piece cache initialized')
    },
    async refresh(): Promise<void> {
        await updateCache(log)
    },
    async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
        const { platformId, locale = LocalesEnum.ENGLISH } = params
        if (isNil(cache)) {
            throw new Error('The cache is not yet initialized, this should not happen')
        }
        const devPieces = await loadDevPiecesIfEnabled(log)
        
        // Filter FIRST by platformId, then de-duplicate - this ensures each platform
        // sees both official pieces and their own custom pieces correctly
        const filteredPieces = [...cache, ...devPieces].filter((piece) => filterPieceBasedOnType(platformId, piece))
        const latestVersions = lastVersionOfEachPiece(filteredPieces)
        
        const translatedPieces = latestVersions.map((piece) => 
            pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: false }),
        )

        return translatedPieces
    },
    async getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null> {
        const { pieceName, version, platformId } = params
        if (isNil(cache)) {
            throw new Error('The cache is not yet initialized, this should not happen')
        }
        const devPieces = await loadDevPiecesIfEnabled(log)
        const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
        if (!isNil(devPiece)) {
            return devPiece
        }
        return cache.find(p => 
            p.name === pieceName && 
            p.version === version && 
            (isNil(platformId) ? isNil(p.platformId) : p.platformId === platformId),
        ) ?? null
    },
    async getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
        const { release, platformId } = params
        if (isNil(cache)) {
            throw new Error('The cache is not yet initialized, this should not happen')
        }
        const devPieces = (await loadDevPiecesIfEnabled(log)).map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
            platformId: piece.platformId,
            pieceType: piece.pieceType,
        }))
        
        const registry = cache.map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
            platformId: piece.platformId,
            pieceType: piece.pieceType,
        }))
        
        return [...registry, ...devPieces]
            .filter((piece) => filterPieceBasedOnType(platformId, piece))
            .filter((piece) => isNil(release) || isSupportedRelease(release, piece))
    },
})

async function updateCache(log: FastifyBaseLogger): Promise<void> {
    const piecesResult = await fetchPieces()
    if (piecesResult.error) {
        log.error({ error: piecesResult.error }, '[localPieceCache] Error fetching local pieces')
        throw piecesResult.error
    }
    cache = piecesResult.data
}

async function fetchPieces(): Promise<Result<PieceMetadataSchema[], Error>> {
    return memoryLock.runExclusive({
        key: 'fetch-pieces',
        fn: async () => {
            const newestState: State | undefined = await repo()
                .createQueryBuilder()
                .select('MAX(updated)', 'recentUpdate')
                .addSelect('count(*)', 'count')
                .getRawOne()

            if (!isNil(newestState) && cache !== null) {
                const newestInCache = cache.reduce((acc, piece) => {
                    return Math.max(dayjs(piece.updated).unix(), acc)
                }, 0)

                const needUpdate = dayjs(newestState.recentUpdate).unix() !== newestInCache || Number(newestState.count) !== cache.length
                if (!needUpdate) {
                    return { data: cache as PieceMetadataSchema[], error: null }
                }
            }

            return tryCatch(fetchPiecesFromDB)
        },
    })
}
